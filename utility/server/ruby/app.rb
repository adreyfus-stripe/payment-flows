require 'stripe'
require 'sinatra'
require 'sinatra/cookies'
require 'dotenv'
require 'json'
require_relative './models.rb'
require_relative './fake_usage.rb'


Dotenv.load(File.dirname(__FILE__) + '/../../.env')
Stripe.api_key = ENV['STRIPE_SECRET_KEY']

set :static, true
set :root, File.dirname(__FILE__)
set :public_folder, Dir.chdir(Dir.pwd + '/../../client')

get '/javascripts/:path' do
  content_type 'text/javascript'
  send_file "javascripts/#{params['path']}"
end

get '/stylesheets/:path' do
  content_type 'text/css'
  send_file "stylesheets/#{params['path']}"
end

get '/images/*.*' do |path, ext|
  if ext == "svg"
    content_type "image/#{ext}+xml"
  else
    content_type "image/#{ext}"
  end
  send_file "images/#{path}.#{ext}"
end

get '/' do
  # Route to the index page which will show our cart 
  content_type 'text/html'
  send_file 'index.html'
end

post '/signup' do 
  # Here we are going to create a new User for RocketFuel

  request.body.rewind  # in case someone already read it
  data = JSON.parse request.body.read

  # Lets create a Customer on Stripe
  customer = Stripe::Customer.create(
    {
      description: "Customer for #{data['email']}",
      email: data['email'],
    }
  )

  # And lets create an internal representation of our User with their Stripe ID
  user = User.new(
    stripe_customer_id: customer.id,
    first_name: data['first_name'],
    last_name: data['last_name'],
    email: data['email']
  )
  user.save

  # Lets return the User to the Client
  status 201
  content_type 'application/json'
  user.to_json
end

get '/pricing' do
  # Here we 
  plan = Stripe::Plan.retrieve(ENV['ROCKET_FUEL_PLAN_ID'])
  content_type 'application/json'
  status 200
  plan.to_json
end

post '/account' do
  # Here we are going to create a new account for a user

  request.body.rewind  # in case someone already read it
  data = JSON.parse request.body.read

  # First we retrieve the user from the Database
  user = User[data['user_id']]
  
  # Make sure we found the user and then...
  if user
    # We attach the Payment Method for this account to the Customer in Stripe
    # so that they can use it. 
    payment_method = Stripe::PaymentMethod.attach(
      data['payment_method'],
      {
        customer: user.stripe_customer_id,
      }
    )

    # We then create a subscription for that customer with the Payment Method
    # as their default Payment Method for this subscription. 
    subscription = Stripe::Subscription.create({
      customer: user.stripe_customer_id,
      default_payment_method: payment_method['id'],
      items: [
        {
          plan: ENV['ROCKET_FUEL_PLAN_ID'],
        },
      ]
    })

    # Finally we create an account mapping in our Database
    account = Account.new(
      user_id: user.id,
      status: 'Active',
      stripe_subscription_id: subscription['id']
    )
    account.save

    # Return a response
    content_type 'application/json'
    status 201
    account.to_json
  end  
end

get '/generate_usage' do
  UsageFaker.fake_usage
  status 200
  content_type 'application/json'
  return {
    status: 'success'
  }.to_json
end

post '/invoice_incoming' do
  payload = request.body.read
    sig_header = request.env['HTTP_STRIPE_SIGNATURE']
    event = nil

    begin
        event = Stripe::Webhook.construct_event(
            payload, sig_header, ENV['STRIPE_WEBHOOK_SECRET']
        )
    rescue JSON::ParserError => e
        # Invalid payload
        status 400
        return
    rescue Stripe::SignatureVerificationError => e
        # Invalid signature
        status 400
        return
    end

    # Do something with event
    event['data']['object']['lines']['data'].each do |line_item|
      puts line_item
    end

    status 200
end
# Login - check user password, return user and account