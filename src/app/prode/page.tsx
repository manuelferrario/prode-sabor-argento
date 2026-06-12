import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProdeClient from './prode-client'

export const revalidate = 60

export default async function ProdePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Buscar participante por email
  const { data: participant } = await supabase
    .from('participants')
    .select('*')
    .eq('email', user.email!)
    .single()

  if (!participant) redirect('/registro')

  // Traer partidos disponibles (featured en grupo + todos los de eliminatoria)
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .or('featured_team.eq.true,round.neq.group')
    .order('match_date', { ascending: true })

  // Traer predicciones existentes del participante
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('participant_id', participant.id)

  const { data: bonusPrediction } = await supabase
    .from('bonus_predictions')
    .select('*')
    .eq('participant_id', participant.id)
    .single()

  return (
    <ProdeClient
      participant={participant}
      matches={matches ?? []}
      predictions={predictions ?? []}
      bonusPrediction={bonusPrediction ?? null}
    />
  )
}
