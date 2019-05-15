var stripe = Stripe("pk_test_7GgBA9fwgnO2lekGMTztCPVV", {
  betas: ["card_payment_method_beta_1"]
});

/* ------- Set up Stripe Elements to use in checkout form ------- */
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

var cardNumber = elements.create("cardNumber", {
  style: style
});

cardNumber.mount("#card-number");

var cardExpiry = elements.create("cardExpiry", {
  style: style
});
cardExpiry.mount("#card-expiry");

var cardCvc = elements.create("cardCvc", {
  style: style
});

cardCvc.mount("#card-cvc");

/* ------- PaymentIntent UI helpers ------- */

var config = {
  authenticationMethod: "use_stripe_sdk", // whether to use redirect or modal
  clientSecret: "", // stores the PaymentIntent client_secret created on the server
  redirectDomain: ""
};

/*
 * Calls stripe.handleCardPayment which creates a pop-up modal to
 * prompt the user to enter  extra authentication details without leaving your page
 */
var triggerModal = function() {
  toggleSpinner(true);
  stripe
    .handleCardPayment(config.clientSecret, cardNumber)
    .then(function(result) {
      toggleSpinner(false);
      if (result.error) {
        var errorMsg = document.getElementById("error");
        errorMsg.style.display = "block";
        errorMsg.style.opacity = 1;
        errorMsg.textContent = result.error.message;
        setTimeout(function() {
          errorMsg.style.display = "none";
          errorMsg.style.opacity = 0;
        }, 4000);
      } else {
        displayMessage();
      }
    });
};

/*
 * Calls stripe.confirmPaymentIntent that will
 * prompt the user to enter extra authentication details without leaving your page
 */
var triggerRedirect = function() {
  toggleSpinner(true);
  stripe
    .confirmPaymentIntent(config.clientSecret, cardNumber, {
      return_url: config.redirectDomain
    })
    .then(function(result) {
      toggleSpinner(false);
      if (result.paymentIntent.status === "succeeded") {
        // Show success screen
        displayMessage();
      } else if (result.paymentIntent.status === "requires_source_action") {
        window.location = result.paymentIntent.next_action.redirect_to_url.url;
      }
    });
};

/* ------- General UI helpers ------- */

/* Add a spinner in the button */
var toggleSpinner = function(spinnerOn) {
  var buttonText = document.getElementById("button-text"),
    buttonSpinner = document.getElementById("button-spinner");
  if (spinnerOn) {
    buttonText.style.display = "none";
    buttonSpinner.style.display = "inline-block";
  } else {
    buttonText.style.display = "inline-block";
    buttonSpinner.style.display = "none";
  }
};

/* Shows a success / error message when the payment is complete */
var displayMessage = function(hasError) {
  document.querySelector("#payment-form").style.display = "none";
  document.querySelector("#checkout-items").style.display = "none";
  document.querySelector("#checkout-form").classList.add("done");
  if (hasError) {
    document.querySelector("#error-message").style.display = "block";
  } else {
    document.querySelector("#success-message").style.display = "block";
  }
};

/*
 * Retrieve the PaymentIntent from the client_sercret sent in the return url
 * and displays a success or error message depending on the status
 */
var handleRedirectReturn = function(clientSecret) {
  stripe.retrievePaymentIntent(clientSecret).then(function(result) {
    var paymentIntent = result.paymentIntent;
    displayMessage(paymentIntent.status !== "succeeded");
  });
};

/* Create a PaymentIntent with a hardcoded amount and currency */
var createPaymentIntent = function() {
  var data = {
    items: [{ id: "dream-machine" }, { id: "revolt-of-public" }],
    currency: "eur"
  };

  return fetch("/create-payment-intent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
    .then(function(result) {
      return result.json();
    })
    .then(function(data) {
      // Store a reference to the client_secret
      config.clientSecret = data.clientSecret;
      config.redirectDomain = data.redirectDomain;
      config.id = data.id;
    });
};

var calculateTax = function(postalCode) {
  var data = {
    items: [{ id: "dream-machine" }, { id: "revolt-of-public" }],
    postalCode: postalCode,
    paymentIntentId: config.id
  };
  return fetch("/calculate-tax", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
    .then(function(result) {
      return result.json();
    })
    .then(function(data) {
      // Update total on the frontend
      document.querySelector(".total").textContent = `€${data.amount}`;
      document.querySelector(".tax").textContent = `€${data.tax}`;
    });
};

/* ------- Set up on page load ------- */

var urlParams = new URLSearchParams(window.location.search);
var clientSecret = urlParams.get("payment_intent_client_secret");

// If we have a client secret in the URL it means that we are being redirected from
if (clientSecret) {
  handleRedirectReturn(clientSecret);
} else {
  createPaymentIntent();
}

document
  .querySelector('input[name="postal-code"]')
  .addEventListener("blur", function(evt) {
    console.log("val", evt.target.value);
    calculateTax(evt.target.value);
  });

/* Update the config when a radio button is selected */

document
  .getElementById("submit-button")
  .addEventListener("click", function(evt) {
    evt.preventDefault();
    if (config.authenticationMethod === "use_stripe_sdk") {
      // Use Stripe.js to trigger a pop-up modal
      triggerModal();
    } else {
      // Create a URL to redirect the customer to
      triggerRedirect();
    }
  });
