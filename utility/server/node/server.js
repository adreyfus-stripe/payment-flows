const express = require('express');
const app = express();
const {resolve} = require('path');
const envPath = resolve('.env');
const env = require('dotenv').config({path: envPath});
const stripe = require('stripe')(env.parsed.STRIPE_SECRET_KEY);
const {db} = require('./db');

app.use(express.static('./client'));
app.use(express.json());

// Init the database.
db.init();

// Render the checkout page
app.get('/', (req, res) => {
  const path = resolve('./client/index.html');
  res.sendFile(path);
});

app.get('/pricing', async (req, res) => {
  const plan = await stripe.plans.retrieve('RFEUBasic');
  res.json(plan);
});

// Signup a new users
app.post('/signup', async (req, res) => {
  const {email, first_name, last_name} = req.body;
  const customer = await stripe.customers.create({
    description: `Customer for ${email}`,
    email,
  });
  const user = await db.createUser({
    email,
    first_name,
    last_name,
    stripe_customer_id: customer.id,
  });
  res.json(user);
});

// Add payment method and subscribe them to plan
app.post('/account', async (req, res) => {
  const {user_id, payment_method: payment_method_id} = req.body;
  const user = await db.retrieveUser({id: user_id});
  if (user) {
    const payment_method = await stripe.paymentMethods.attach(
      payment_method_id,
      {
        customer: user.stripe_customer_id,
      }
    );

    const subscription = await stripe.subscriptions.create({
      customer: user.stripe_customer_id,
      default_payment_method: payment_method.id,
      items: [
        {
          plan: 'RFEUBasic',
        },
      ],
    });

    const account = await db.createAccount({
      user_id: user.id,
      subscription_id: subscription.id,
    });
    res.json(account);
  }
});

// A webhook to receive events sent from Stripe
// You can listen for specific events
//
app.post('/webhook', async (req, res) => {
  // Check if webhook signing is configured.
  if (env.parsed.STRIPE_WEBHOOK_SECRET) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        env.parsed.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
    data = event.data;
    eventType = event.type;
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // we can retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  }
});

// Start server
const listener = app.listen(process.env.PORT || 3000, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
