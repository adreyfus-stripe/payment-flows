# frozen_string_literal: true

# Set your secret key: remember to change this to your live secret key in production
# See your keys here: https://dashboard.stripe.com/account/apikeys
require 'sinatra'
require 'sinatra/reloader'
require 'stripe'
require 'dotenv'
require 'json'

set :public_folder, './client'

Dotenv.load('../../.env')
Stripe.api_key = ENV['STRIPE_SECRET_KEY']

get '/' do
  File.read(File.join('client', 'index.html'))
end

get '/success' do
  File.read(File.join('client', 'success.html'))
end

get '/cancel' do
  File.read(File.join('client', 'cancel.html'))
end

post '/create-session' do
  params = JSON.parse(request.body.read)

  session = Stripe::Checkout::Session.create(
    payment_method_types: ['card'],
    line_items: params['lineItems'],
    success_url: "https://#{ENV['DOMAIN']}/success",
    cancel_url: "https://#{ENV['DOMAIN']}/cancel"
  )

  { session: session.id }.to_json
end

post '/webhook' do
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

  # Handle the event
  if event.type == 'checkout.session.completed'
    puts '💰 Your user provided payment details!'
  end

  status 200
end
