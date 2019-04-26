(async () => {
  let user;
  let account;

  const stripe = Stripe('pk_test_SGCBD9tHCwzRbldi530fjAa300GKHEPKAl');

  const elements = stripe.elements();
  const cardElement = elements.create('card');
  cardElement.mount('#card-element');

  const signupForm = document.getElementById('signup-form');
  const cardForm = document.getElementById('card-form');
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
    signupForm.style.display = 'none';
    fetchPricing();
    cardForm.style.display = 'block';
  });

  cardForm.addEventListener('click', async event => {
    event.preventDefault();
    const {token, error} = await stripe.createToken(
      cardElement, 
      {name: `${user.first_name} ${user.last_name}`}
    );
    if (error) {
      // Show error in payment form
    } else {
      // Send paymentMethod.id to your server (see Step 2)
      account = await fetch('/account', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          user_id: user.id,
          token: token.id,
        }),
      }).then(res => res.json());

      cardForm.style.display = 'none';
      document.getElementById('usage-button').style.display = 'block';
    }
  });

  // Generate usage.
  document
    .getElementById('usage-button')
    .addEventListener('click', async () => {
      document.getElementById('usage-button').toggleAttribute('disabled');
      await fetch(`/generate_usage/${account.id}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
      });
      document.getElementById('usage-button').style.display = 'none';
      await fetchUsage(account.id);
    });

  async function fetchPricing() {
    // Fetch pricing details
    const plan = await fetch('/pricing').then(res => res.json());
    const pricingDetails = `${plan.usage_type} ${
      plan.object
    } charging ${plan.amount / 100} ${plan.currency} ${
      plan.billing_scheme
    } every ${plan.interval_count} ${plan.interval}`;
    document.querySelector('#pricing-details').textContent = pricingDetails;
  }

  async function fetchUsage(account_id) {
    const usage = await fetch(`/usage/${account_id}`).then(res => res.json());
    const usageDetails = `Your current usage bill is ${usage.amount / 100} ${
      usage.currency
    }.`;
    document.querySelector('#pricing-details').textContent = usageDetails;
  }
})();
