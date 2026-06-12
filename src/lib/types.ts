export type MatchStatus = 'upcoming' | 'live' | 'finished'
export type MatchRound = 'group' | 'round_of_32' | 'round_of_16' | 'quarterfinal' | 'semifinal' | 'final'

export interface Match {
  id: string
  match_date: string
  team_home: string
  team_away: string
  team_home_flag: string
  team_away_flag: string
  group_name: string | null
  round: MatchRound
  home_score: number | null
  away_score: number | null
  went_to_penalties: boolean
  winner: string | null
  status: MatchStatus
  featured_team: boolean
  api_match_id: number | null
}

export interface Participant {
  id: string
  name: string
  phone: string
  email: string
  apodo: string | null
  instagram_user: string | null
  instagram_confirmed: boolean
  total_chimichurros: number
  streak: number
  max_streak: number
  device_id: string | null
  created_at: string
}

export interface Prediction {
  id: string
  participant_id: string
  match_id: string
  predicted_home: number
  predicted_away: number
  chimichurros_earned: number
  created_at: string
}

export interface BonusPrediction {
  id: string
  participant_id: string
  tournament_winner: string | null
  top_scorer: string | null
  chimichurros_earned: number
}

export interface RankingEntry {
  rank: number
  participant_id: string
  name: string
  total_chimichurros: number
  streak: number
  max_streak: number
  predictions_count: number
}
