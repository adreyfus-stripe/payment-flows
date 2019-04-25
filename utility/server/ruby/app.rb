require 'stripe'
require 'sinatra'
require 'sinatra/cookies'
require 'sinatra/reloader'
require 'dotenv'
require 'json'
require './db.rb'

Dotenv.load
Stripe.api_key = ENV['STRIPE_KEY']
RocketFuelDB.init

get '/' do
  erb :index
end
