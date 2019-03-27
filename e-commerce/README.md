# 🛍 E-commerce

[wip] Due to the nature of the Internet, e-commerce companies can quickly scale to a global audience. Here we have an example online (but sadly fake) store for Stripe merchandise. 

See the [full demo](https://stripe-payments-demo.appspot.com) or explore individual payment flows below:

|    Flow | Stripe products |
| :--- | :--- |
[**Redirect users to a Stripe-hosted payment page**](https://github.com/adreyfus-stripe/payment-flows/tree/master/e-commerce/payment-checkout) <br/> Programmically create a Checkout Session that will redirect the user to a pre-built (but brandable!) payment page hosted on Stripe. | ￭ [Checkout Sessions API](https://stripe.com/docs/payments/checkout/server) 
[**Create a custom payment payment**](https://github.com/adreyfus-stripe/payment-flows) <br/> For a more custom payments experience, use Stripe's pre-built form elements to make a truly custom and secure payments experience. | ￭ [Elements](https://stripe.com/docs/payments/checkout/server) <br/> ￭ [PaymentIntents API](https://stripe.com/docs/payments/payment-intents)