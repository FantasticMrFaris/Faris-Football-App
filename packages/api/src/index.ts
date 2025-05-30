import express from 'express';
import cors from 'cors';
import { env } from './config';
import { stripe } from './stripe';
import { supabase } from './supabase';

const app = express();

app.use(cors());
app.use(express.json());

// Create Stripe Checkout session
app.post('/stripe/create-checkout-session', async (req, res) => {
  const { gameId, userId } = req.body;

  try {
    const { data: game } = await supabase
      .from('match_games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: game.title,
            },
            unit_amount: game.fee_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/games/${gameId}/success`,
      cancel_url: `${process.env.CLIENT_URL}/games/${gameId}`,
      metadata: {
        gameId,
        userId,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook handler
app.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig!,
      env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { gameId, userId } = session.metadata!;

      // Add player to game
      await supabase
        .from('player_on_game')
        .insert({ game_id: gameId, user_id: userId });

      // Check if game is now full
      const { data: playerCount } = await supabase
        .from('player_on_game')
        .select('*', { count: 'exact' })
        .eq('game_id', gameId);

      const { data: game } = await supabase
        .from('match_games')
        .select('capacity')
        .eq('id', gameId)
        .single();

      if (playerCount === game?.capacity) {
        // Invoke edge function to notify players
        await fetch(`${env.SUPABASE_URL}/functions/v1/notify-game-filled`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gameId }),
        });
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

const port = parseInt(env.PORT);
app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});