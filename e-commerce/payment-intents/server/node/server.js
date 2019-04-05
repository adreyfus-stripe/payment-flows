const express = require("express");
const app = express();
const { resolve } = require("path");
const envPath = resolve(".env");
const env = require("dotenv").config({ path: envPath });

const stripe = require("stripe")(env.parsed.STRIPE_SECRET_KEY);

app.use(express.static("./client"));

// Grants access to the raw request body to use for webhook signing
// Learn more https://stripe.com/docs/webhooks/signatures
app.use(
  express.json({
    verify: function(req, res, buf) {
      if (req.originalUrl.startsWith("/webhook")) {
        req.rawBody = buf.toString();
      }
    }
  })
);

// Render the checkout page
app.get("/", function(request, response) {
  const path = resolve("./client/index.html");
  response.sendFile(path);
});

// Create a Checkout Session that is used to render the Stripe-hosted payment page
app.post("/create-payment-intent", async (req, res) => {
  const { confirmationMethod, captureMethod } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1979,
    currency: "eur",
    capture_method: captureMethod,
    confirmation_method: confirmationMethod
  });
  res.send({
    piId: paymentIntent.id,
    piClientSecret: paymentIntent.client_secret,
    piConfirmationMethod: paymentIntent.confirmationMethod,
    paymentIntent: paymentIntent
  });
});

// Create a Checkout Session that is used to render the Stripe-hosted payment page
app.post("/confirm-payment-intent", async (req, res) => {
  const { paymentMethod, paymentIntent } = req.body;
  const additionalData = paymentMethod ? { payment_method: paymentMethod } : {};
  try {
    const updatedPaymentIntent = await stripe.paymentIntents.confirm(
      paymentIntent,
      additionalData
    );
    console.log("updated", updatedPaymentIntent);
    if (
      updatedPaymentIntent.status === "requires_source_action" ||
      updatedPaymentIntent.status === "requires_action"
    ) {
      res.send({ requiresAuth: true, piClientSecret: updatedPaymentIntent.client_secret });
    } else if (updatedPaymentIntent.status === "succeeded") {
      // The payment succeeded and you can immediately fulfill here!
      res.send({ requiresAuth: false });
    }
  } catch (err) {
    console.log("err", err);
    res.send({ error: err.message });
  }
});

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

// Start server
const listener = app.listen(process.env.PORT || 3000, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
