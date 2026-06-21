-- =============================================
-- PRODE SABOR ARGENTO — Mundial 2026
-- Correr en Supabase SQL Editor
-- =============================================

-- Participantes
create table participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null unique,
  instagram_confirmed boolean default false,
  total_chimichurros integer default 0,
  streak integer default 0,
  max_streak integer default 0,
  created_at timestamptz default now()
);

-- Partidos del Mundial 2026
create table matches (
  id uuid primary key default gen_random_uuid(),
  match_date timestamptz not null,
  team_home text not null,
  team_away text not null,
  team_home_flag text default '',
  team_away_flag text default '',
  group_name text,
  round text not null default 'group',
  home_score integer,
  away_score integer,
  went_to_penalties boolean default false,
  winner text,
  status text not null default 'upcoming',
  featured_team boolean default false,
  api_match_id integer unique,
  created_at timestamptz default now()
);

-- Predicciones
create table predictions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) on delete cascade,
  match_id uuid references matches(id) on delete cascade,
  predicted_home integer not null,
  predicted_away integer not null,
  chimichurros_earned integer default 0,
  created_at timestamptz default now(),
  unique(participant_id, match_id)
);

-- Predicciones bonus (1 por participante)
create table bonus_predictions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) on delete cascade unique,
  tournament_winner text,
  top_scorer text,
  chimichurros_earned integer default 0
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table participants enable row level security;
alter table matches enable row level security;
alter table predictions enable row level security;
alter table bonus_predictions enable row level security;

-- Matches: lectura pública
create policy "matches_public_read" on matches for select using (true);

-- Participants: lectura pública del ranking
create policy "participants_public_read" on participants for select using (true);

-- Participants: cualquiera puede registrarse (insert)
create policy "participants_insert" on participants for insert with check (true);

-- Predictions: lectura pública
create policy "predictions_public_read" on predictions for select using (true);

-- Predictions: solo el dueño puede insertar/actualizar (via email en session)
create policy "predictions_insert" on predictions for insert with check (true);
create policy "predictions_update" on predictions for update using (true);

-- Bonus predictions
create policy "bonus_public_read" on bonus_predictions for select using (true);
create policy "bonus_insert" on bonus_predictions for insert with check (true);
create policy "bonus_update" on bonus_predictions for update using (true);

-- =============================================
-- FUNCIÓN: calcular chimichurros de una predicción
-- =============================================

create or replace function calculate_chimichurros(
  p_predicted_home integer,
  p_predicted_away integer,
  p_actual_home integer,
  p_actual_away integer,
  p_went_to_penalties boolean default false
) returns integer as $$
declare
  predicted_result text;
  actual_result text;
begin
  -- Resultado exacto = 3 chimichurros
  if p_predicted_home = p_actual_home and p_predicted_away = p_actual_away then
    return 3;
  end if;

  -- Determinar resultado predicho
  if p_predicted_home > p_predicted_away then predicted_result := 'home';
  elsif p_predicted_home < p_predicted_away then predicted_result := 'away';
  else predicted_result := 'draw';
  end if;

  -- Determinar resultado real
  if p_actual_home > p_actual_away then actual_result := 'home';
  elsif p_actual_home < p_actual_away then actual_result := 'away';
  else actual_result := 'draw';
  end if;

  -- Winner/empate correcto = 1 chimichurro
  if predicted_result = actual_result then
    return 1;
  end if;

  return 0;
end;
$$ language plpgsql;

-- =============================================
-- FUNCIÓN: actualizar puntos cuando se carga resultado
-- =============================================

create or replace function update_chimichurros_for_match(match_id_param uuid)
returns void as $$
declare
  match_record matches%rowtype;
  pred record;
  base_earned integer;
  total_earned integer;
  new_streak integer;
  streak_row record;
begin
  select * into match_record from matches where id = match_id_param;

  if match_record.home_score is null or match_record.away_score is null then
    return;
  end if;

  for pred in
    select * from predictions where match_id = match_id_param
  loop
    base_earned := calculate_chimichurros(
      pred.predicted_home,
      pred.predicted_away,
      match_record.home_score,
      match_record.away_score,
      match_record.went_to_penalties
    );

    -- Racha: recorre TODOS los partidos terminados y recalcula el puntaje BASE
    -- de cada uno al vuelo (predicción vs resultado real). Nunca confía en
    -- chimichurros_earned ya guardado — así el cálculo es siempre idempotente
    -- y no se contamina con bonus de corridas anteriores.
    new_streak := 0;
    for streak_row in (
      select
        case
          when p.predicted_home is null then 0
          else calculate_chimichurros(p.predicted_home, p.predicted_away, m.home_score, m.away_score, m.went_to_penalties)
        end as base
      from matches m
      left join predictions p
        on p.match_id = m.id and p.participant_id = pred.participant_id
      where m.status = 'finished'
        and m.home_score is not null and m.away_score is not null
      order by m.match_date desc
    ) loop
      if streak_row.base > 0 then
        new_streak := new_streak + 1;
      else
        exit;
      end if;
    end loop;

    -- Bonus de racha: cada 5 aciertos consecutivos
    total_earned := base_earned;
    if new_streak > 0 and new_streak % 5 = 0 then
      total_earned := total_earned + 3;
    end if;

    update predictions
    set chimichurros_earned = total_earned
    where id = pred.id;

    update participants
    set
      total_chimichurros = (
        select coalesce(sum(chimichurros_earned), 0) from predictions where participant_id = pred.participant_id
      ),
      streak = new_streak,
      max_streak = greatest(max_streak, new_streak)
    where id = pred.participant_id;
  end loop;

  -- Romper la racha de quienes NO cargaron predicción para este partido
  update participants
  set streak = 0
  where streak > 0
    and id not in (
      select participant_id from predictions where match_id = match_id_param
    );
end;
$$ language plpgsql;

-- =============================================
-- ÍNDICES para performance del ranking
-- =============================================

create index idx_participants_chimichurros on participants(total_chimichurros desc);
create index idx_predictions_participant on predictions(participant_id);
create index idx_predictions_match on predictions(match_id);
create index idx_matches_date on matches(match_date);
create index idx_matches_status on matches(status);
