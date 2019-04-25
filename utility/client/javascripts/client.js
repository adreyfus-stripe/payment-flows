(async () => {
  let user;

  const stripe = Stripe('pk_test_SGCBD9tHCwzRbldi530fjAa300GKHEPKAl');

  const elements = stripe.elements();
  const cardElement = elements.create('card');
  cardElement.mount('#card-element');

  const signupForm = document.getElementById('signup-form');
  signupForm.addEventListener('submit', async event => {
    event.preventDefault();
    const email = signupForm.querySelector('input[name=email]').value;
    const first_name = signupForm.querySelector('input[name=first_name]').value;
    const last_name = signupForm.querySelector('input[name=last_name]').value;
    user = await fetch('/signup', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email,
        first_name,
        last_name,
      }),
    }).then(res => res.json());
  });

  const cardForm = document.getElementById('card-form');
  cardForm.addEventListener('click', async ev => {
    event.preventDefault();
    const {paymentMethod, error} = await stripe.createPaymentMethod(
      'card',
      cardElement,
      {
        billing_details: {name: `${user.first_name} ${user.last_name}`},
      }
    );
    if (error) {
      // Show error in payment form
    } else {
      // Send paymentMethod.id to your server (see Step 2)
      const response = await fetch('/account', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          user_id: user.id,
          payment_method: paymentMethod.id,
        }),
      }).then(res => res.json());

      console.log(response);
    }
  });
})();
