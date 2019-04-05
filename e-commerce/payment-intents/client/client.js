var stripe = Stripe("pk_test_7GgBA9fwgnO2lekGMTztCPVV", {
  betas: ["card_payment_method_beta_1"]
});

/* Set up Stripe Elements */
var elements = stripe.elements();
var style = {
  base: {
    color: "#32325d",
    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    fontSmoothing: "antialiased",
    fontSize: "16px",
    "::placeholder": {
      color: "#aab7c4"
    }
  },
  invalid: {
    color: "#fa755a",
    iconColor: "#fa755a"
  }
};

var cardElement = elements.create("card", { style: style });

// Add an instance of the card Element into the `card-element` <div>.
cardElement.mount("#card-element");

/* Default configuration for our PaymentIntent */
var config = {
  authMethod: "use_stripe_sdk",
  confirmationMethod: "automatic",
  captureMethod: "automatic"
};

var updatePaymentIntentView = function(result) {
  var json = JSON.stringify(result.paymentIntent, null, 2);
  var code = Prism.highlight(json, Prism.languages.json, "json");
  document.getElementById("pi-preview").innerHTML = code;
};

var handleAutoConfirmation = function(data) {
  stripe
    .handleCardPayment(data.piClientSecret, cardElement)
    .then(updatePaymentIntentView);
};

var handleManualConfirmation = function(data) {
  // We have a PaymentIntent with confirmation_method: true
  stripe
    .createPaymentMethod("card", cardElement)
    .then(function(result) {
      var paymentMethod = result.paymentMethod;
      // Send the PaymentIntent and PaymentMethod to the server
      return manuallyConfirmOnServer(data.piId, paymentMethod.id);
    })
    .then(function(result) {
      return result.json();
    })
    .then(function(data) {
      if (data.requiresAuth) {
        stripe.handleCardAction(data.piClientSecret).then(function(result) {
          updatePaymentIntentView(result);
          return manuallyConfirmOnServer(result.paymentIntent.id);
        });
      }
    });
};

// Manual confirmation requires trip to your server
// This enables you to finalize the payment on the server and handle any post-payment logic in the same method
var manuallyConfirmOnServer = function(paymentIntentId, paymentMethodId) {
  var data = { paymentIntent: paymentIntentId };
  if (paymentMethodId) {
    data.paymentMethod = paymentMethodId;
  }
  return fetch("/confirm-payment-intent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
};

/* Update our PaymentIntent configuration when a radio button is selected */
document
  .getElementById("config-options")
  .addEventListener("change", function(evt) {
    config[evt.target.name] = evt.target.value;
  });

/* Create a PaymentIntent with the current config */
document
  .getElementById("create-pi-btn")
  .addEventListener("click", function(evt) {
    fetch("/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(config)
    }).then(res => {
      res.json().then(data => {
        // Display PaymentIntent JSON
        updatePaymentIntentView(data);

        document
          .getElementById("pay-btn")
          .addEventListener("click", function(evt) {
            if (config.confirmationMethod === "automatic") {
              // Then all we need to do is call handleCardPayment with the PaymentIntent you created!
              handleAutoConfirmation(data);
            } else {
              handleManualConfirmation(data);
            }
          });
      });
    });
  });
