const express = require("express");
const app = express();
const { resolve } = require("path");
const envPath = resolve("../../.env");
const env = require("dotenv").config({ path: envPath });
const stripe = require("stripe")(env.parsed.STRIPE_SECRET_KEY);

app.use(express.static("../../client"));
app.use(
  express.json({
    verify: function(req, res, buf) {
      console.log("here", );
      if (req.originalUrl.startsWith("/webhook")) {
        console.log("buffer", buf);
        req.rawBody = buf.toString();
      }
    }
  })
);

// Deliver checkout page
app.get("/", function(request, response) {
  const path = resolve("../../client/index.html");
  response.sendFile(path);
});

app.post("/create-session", async (req, res) => {
  const { lineItems } = req.body;
  const session = await stripe.checkout.sessions.create(
    // What does cancel url mean?
    // Can we have metadata here?
    {
      success_url: "http://0dfad549.ngrok.io/success",
      cancel_url: "http://0dfad549.ngrok.io/cancel",
      payment_method_types: ["card"],
      line_items: lineItems
    },
    { stripe_version: "2018-11-08; checkout_sessions_beta=v1" }
  );
  res.send({ session: session.id });
});

// Stripe will redirect here if the payment succeeds
app.get("/success", async (req, res) => {
  console.log("req", req.query);
  const path = resolve("../../client/success.html");
  res.sendFile(path);
});

// Stripe will redirect here if the user cancels
app.get("/cancel", async (req, res) => {
  // Handle user navigating away from your Checkout page
  const path = resolve("../../client/error.html");
  res.sendFile(path);
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
    // retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  }

  if (eventType === "checkout.session.completed") {
    console.log("💰Your user paid!");
    // Fulfill any orders or e-mail receipts 
    res.sendStatus(200);
  }
});

// Start server
const listener = app.listen(process.env.PORT || 3000, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
