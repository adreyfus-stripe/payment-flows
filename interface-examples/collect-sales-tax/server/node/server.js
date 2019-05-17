const express = require("express");
const app = express();
const { resolve } = require("path");
const envPath = resolve(".env");
const env = require("dotenv").config({ path: envPath });
const stripe = require("stripe")(env.parsed.STRIPE_SECRET_KEY);

app.use(express.static("./client"));
app.use(express.json());

const PRICES = {
  "revolt-of-public": 2499,
  "dream-machine": 3490
};

// Render the checkout page
app.get("/", (request, response) => {
  const path = resolve("./client/index.html");
  response.sendFile(path);
});

// Create a PaymentIntent to use in our checkout page
app.post("/create-payment-intent", async (req, res) => {
  const { items, currency } = req.body;
  const initialAmount = calculateOrderAmount(items);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: initialAmount,
    currency: currency
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
    redirectDomain: env.parsed.REDIRECT_DOMAIN,
    id: paymentIntent.id
  });
});

app.post("/calculate-tax", async (req, res) => {
  const { items, postalCode, paymentIntentId } = req.body;
  const orderAmount = calculateOrderAmount(items);
  const tax = postalCode ? calculateTax(postalCode, orderAmount) : 0;
  const total = orderAmount + tax;

  stripe.paymentIntents.update(paymentIntentId, { amount: total });
  res.send({
    amount: ((orderAmount + tax) / 100).toFixed(2),
    tax: (tax / 100).toFixed(2)
  });
});

// A webhook to receive events sent from Stripe
// You can listen for specific events
//
app.post("/webhook", async (req, res) => {
  // Check if webhook signing is configured.
  if (env.parsed.STRIPE_WEBHOOK_SECRET) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers["stripe-signature"];
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

  if (eventType === "checkout.session.completed") {
    console.log("💰Your user provided payment details!");
    // Fulfill any orders or e-mail receipts
    res.sendStatus(200);
  }
});

const calculateTax = (postalCode, amount) => {
  // Here you would use the postal code to calculate the right amount of tax for the purchase
  return Math.floor(Math.random() * 500);
};

const calculateOrderAmount = items => {
  return items.reduce((acc, item) => acc + PRICES[item.id], 0);
};

// Start server
const listener = app.listen(process.env.PORT || 3000, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
