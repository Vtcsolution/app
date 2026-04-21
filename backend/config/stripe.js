const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Credit conversion rates
const CREDIT_SYSTEM = {
  CREDIT_RATE: parseFloat(process.env.CREDIT_RATE) || 1, // 1 credit = 1€
  MINIMUM_TOPUP_AMOUNT: parseFloat(process.env.MINIMUM_TOPUP_AMOUNT) || 5, // Minimum 5€
  CURRENCY: process.env.STRIPE_CURRENCY || 'eur', // EURO currency
  
  // Convert euros to credits
  dollarsToCredits: function(euros) {
    return Math.floor(euros);
  },
  
  // Convert credits to euros
  creditsToDollars: function(credits) {
    return credits;
  },
  
  // Get credit plans with EURO pricing - Updated IDs to match frontend
  getPlans: function() {
    return [
      { 
        id: 'starter', // For backward compatibility
        name: 'Forfait 10 Minutes', 
        amount: 20, // 20€
        credits: 20,
        totalCredits: 20,
        bonusCredits: 0,
        description: '10 minutes de consultation pour 20€',
        pricePerCredit: 1.00,
        pricePerMinute: 2.00,
        minutes: 10
      },
      { 
        id: 'popular', // For backward compatibility
        name: 'Forfait 30 Minutes', 
        amount: 50, // 50€
        credits: 50,
        totalCredits: 50,
        bonusCredits: 0,
        description: '30 minutes de consultation pour 50€',
        pricePerCredit: 1.00,
        pricePerMinute: 1.67,
        minutes: 30
      },
      { 
        id: 'premium', // This is what frontend is sending
        name: 'Forfait 60 Minutes', 
        amount: 90, // 90€
        credits: 90,
        totalCredits: 90,
        bonusCredits: 0,
        description: '60 minutes de consultation pour 90€',
        pricePerCredit: 1.00,
        pricePerMinute: 1.50,
        minutes: 60
      },
      // Additional plan IDs for flexibility
      { 
        id: '10min',
        name: 'Forfait 10 Minutes', 
        amount: 20,
        credits: 20,
        totalCredits: 20,
        bonusCredits: 0,
        description: '10 minutes de consultation pour 20€',
        pricePerCredit: 1.00,
        pricePerMinute: 2.00,
        minutes: 10
      },
      { 
        id: '30min',
        name: 'Forfait 30 Minutes', 
        amount: 50,
        credits: 50,
        totalCredits: 50,
        bonusCredits: 0,
        description: '30 minutes de consultation pour 50€',
        pricePerCredit: 1.00,
        pricePerMinute: 1.67,
        minutes: 30
      },
      { 
        id: '60min',
        name: 'Forfait 60 Minutes', 
        amount: 90,
        credits: 90,
        totalCredits: 90,
        bonusCredits: 0,
        description: '60 minutes de consultation pour 90€',
        pricePerCredit: 1.00,
        pricePerMinute: 1.50,
        minutes: 60
      },
      // Bonus plans
      { 
        id: '100euro',
        name: 'Forfait 100€', 
        amount: 100,
        credits: 100,
        totalCredits: 110,
        bonusCredits: 10,
        description: '100€ + 10 crédits bonus = 110 minutes',
        pricePerCredit: 0.91,
        pricePerMinute: 0.91,
        minutes: 110
      },
      { 
        id: '200euro',
        name: 'Forfait 200€', 
        amount: 200,
        credits: 200,
        totalCredits: 230,
        bonusCredits: 30,
        description: '200€ + 30 crédits bonus = 230 minutes',
        pricePerCredit: 0.87,
        pricePerMinute: 0.87,
        minutes: 230
      }
    ];
  },

  // Calculate bonus credits based on amount
  calculateBonusCredits: function(amount) {
    if (amount >= 200) return 30;
    if (amount >= 100) return 10;
    if (amount >= 50) return 0;
    if (amount >= 20) return 0;
    return 0;
  }
};

// Stripe Service Functions
const stripeService = {
  // Create Payment Intent for custom amount
  createPaymentIntent: async (amount, userId, planName = 'custom') => {
    try {
      const amountInCents = Math.round(amount * 100);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: CREDIT_SYSTEM.CURRENCY,
        metadata: {
          userId: userId.toString(),
          planName,
          amount: amount.toString(),
          credits: CREDIT_SYSTEM.dollarsToCredits(amount).toString(),
          totalCredits: (CREDIT_SYSTEM.dollarsToCredits(amount) + 
                        CREDIT_SYSTEM.calculateBonusCredits(amount)).toString(),
          bonusCredits: CREDIT_SYSTEM.calculateBonusCredits(amount).toString(),
          currency: 'EUR'
        }
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        currency: 'EUR'
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },

  // Create Checkout Session for predefined plans
  createCheckoutSession: async (planId, userId, userEmail = null) => {
    try {
      const plans = CREDIT_SYSTEM.getPlans();
      const plan = plans.find(p => p.id === planId);
      
      if (!plan) {
        console.error('Available plan IDs:', plans.map(p => p.id));
        throw new Error(`Plan not found: ${planId}. Available plans: ${plans.map(p => p.id).join(', ')}`);
      }

      const amountInCents = Math.round(plan.amount * 100);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur', // EURO currency
              product_data: {
                name: plan.name,
                description: plan.description,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment/result?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        customer_email: userEmail,
        metadata: {
          userId: userId.toString(),
          planId: plan.id,
          planName: plan.name,
          amount: plan.amount.toString(),
          credits: plan.credits.toString(),
          totalCredits: plan.totalCredits.toString(),
          bonusCredits: plan.bonusCredits.toString(),
          currency: 'EUR',
          minutes: plan.minutes?.toString() || '0'
        },
      });

      return {
        sessionId: session.id,
        url: session.url,
        amount: plan.amount,
        planName: plan.name,
        currency: 'EUR'
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  // Verify webhook signature
  verifyWebhookSignature: (req, signature) => {
    try {
      return stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      throw new Error('Invalid signature');
    }
  },

  // Get payment intent details
  getPaymentIntent: async (paymentIntentId) => {
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      throw error;
    }
  },

  // Get checkout session details
  getCheckoutSession: async (sessionId) => {
    try {
      return await stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      console.error('Error retrieving checkout session:', error);
      throw error;
    }
  }
};

module.exports = {
  stripe,
  CREDIT_SYSTEM,
  stripeService
};