const express = require('express');
const app = express();
const {resolve} = require('path');
const envPath = resolve('.env');
const env = require('dotenv').config({path: envPath});
const stripe = require('stripe')(env.parsed.STRIPE_SECRET_KEY);
const {db} = require('./db');
const {pwd, auth} = require('./auth');
const passport = require('passport');
const Strategy = require('passport-local').Strategy;

app.use(express.static('./client'));
app.use(express.json());

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({extended: true}));
app.use(
  require('express-session')({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

// Init the database.
db.init();

// Render the checkout page
app.get('/', (request, response) => {
  const path = resolve('./client/index.html');
  response.sendFile(path);
});
app.get('/login', (request, response) => {
  const path = resolve('./client/login.html');
  response.sendFile(path);
});
app.get('/dashboard', auth.loginMiddleware, (request, response) => {
  console.log(request.user);
  const path = resolve('./client/dashboard.html');
  response.sendFile(path);
});

// Signup a new users
app.post('/signup', async (req, res) => {
  const {email, first_name, last_name, password} = req.body;
  const customer = await stripe.customers.create({
    description: `Customer for ${email}`,
    email,
  });
  const hashed = await pwd.hash(password);
  const user = await db.createUser({
    email,
    first_name,
    last_name,
    stripe_customer_id: customer.id,
    password: hashed,
  });
  res.json(user);
});

// Login via passport authentication.
app.post(
  '/login',
  passport.authenticate('local', {failureRedirect: '/login'}),
  function(req, res) {
    res.redirect('/dashboard');
  }
);

// Serialize pilots sessions for Passport
passport.serializeUser((user, callback) => {
  callback(null, user.id);
});
// TODO
passport.deserializeUser(async (id, callback) => {
  const {err, user} = await db.retrieveUser({id});
  console.log(`deserialised user with id ${user.id}`);
  callback(err, user);
});

// Define the login strategy for pilots based on email and password
passport.use(
  new Strategy(async function(username, password, done) {
    const {user} = await db.retrieveUser({email: username});
    const verified = await pwd.verify(user, password);
    if (!user) {
      return done(null, false, {message: 'Unknown user!'});
    }
    if (!verified) {
      return done(null, false, {message: 'Invalid password!'});
    }
    return done(null, user);
  })
);

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
