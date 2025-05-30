import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  const { gameId } = await req.json()

  // Get game details
  const { data: game } = await supabase
    .from('match_games')
    .select('*, profiles!match_games_organiser_id_fkey(expo_push_token)')
    .eq('id', gameId)
    .single()

  if (!game) {
    return new Response(JSON.stringify({ error: 'Game not found' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 404,
    })
  }

  // Get all players in the game
  const { data: players } = await supabase
    .from('player_on_game')
    .select('profiles(expo_push_token)')
    .eq('game_id', gameId)

  // Collect all push tokens
  const pushTokens = players
    ?.map((p) => p.profiles.expo_push_token)
    .filter(Boolean) || []

  // Send push notifications
  if (pushTokens.length > 0) {
    const messages = pushTokens.map((token) => ({
      to: token,
      sound: 'default',
      title: 'Game is Full!',
      body: `The game "${game.title}" has reached capacity`,
      data: { gameId },
    }))

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })
  }

  // Broadcast to Realtime
  await supabase
    .from('match_games')
    .update({ status: 'FULL' })
    .eq('id', gameId)

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})