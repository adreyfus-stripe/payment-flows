var stripe = Stripe("pk_test_hbzMnxRgrsHSc2nqeXsXCJGu");

document.getElementById("in-flight").style.display = "none";
document.getElementById("payment-page").style.display = "none";

document.getElementById("start-ride-btn").onclick = function(evt) {
  evt.preventDefault();
  document.getElementById("opening-page").style.display = "none";
  document.getElementById("in-flight").style.display = "block";

  setTimeout(function() {
    document.getElementById("in-flight").style.display = "none";
    document.getElementById("payment-page").style.display = "block";
    var elements = stripe.elements();
    var card = elements.create("card", {
      style: {
        base: {
          color: "#32325D",
          fontWeight: 500,
          fontSize: "16px",
          fontSmoothing: "antialiased",

          "::placeholder": {
            color: "#CFD7DF"
          }
        },
        invalid: {
          color: "#E25950"
        }
      }
    });
    card.mount("#payment-form");
  }, 2000);
};

function getRandomPosition() {
  var h = window.innerHeight - 50;
  var w = window.innerWidth - 50;
  var nh = Math.floor(Math.random() * h);
  var nw = Math.floor(Math.random() * w);
  return [nh, nw];
}

card.mount("#example4-card");
