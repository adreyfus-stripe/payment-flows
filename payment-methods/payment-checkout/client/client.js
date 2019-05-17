var stripe = Stripe("pk_test_7GgBA9fwgnO2lekGMTztCPVV", {
  betas: ["checkout_beta_4"]
});

fetch("/create-session", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    lineItems: [
      { quantity: 2, amount: 799, name: "Stripe pins", currency: "eur" },
      { quantity: 1, amount: 399, name: "Increment Magazine", currency: "eur" }
    ]
  })
}).then(res => {
  res.json().then(data => {
    document.getElementById("pay-btn").onclick = evt => {
      stripe
        .redirectToCheckout({
          sessionId: data.session
        })
        .then(function(result) {
          console.log("result", result);
        });
    };
  });
});

function receiveMessage(event) {
  console.log("received message!", event);

  if (event.data === "show-steps") {
    document.getElementById("message").textContent = "Show steps!";
  }
}

window.addEventListener("message", receiveMessage, false);
