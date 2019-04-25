(async () => {
  const signupForm = document.getElementById('signup-form');
  signupForm.addEventListener('submit', async event => {
    event.preventDefault();
    const email = signupForm.querySelector('input[name=email]').value;
    const first_name = signupForm.querySelector('input[name=first_name]').value;
    const last_name = signupForm.querySelector('input[name=last_name]').value;
    const user = await fetch('/signup', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email,
        first_name,
        last_name,
      }),
    }).then(res => res.json());
    console.log(user);
  });
})();
