require 'stripe'
require 'sinatra'
require 'sinatra/cookies'
require 'dotenv'
require 'json'
require_relative './models.rb'

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
  customer = Stripe::Customer.create(
    {
      description: "Customer for #{params['email']}",
      email: params['email'],
    }
  )
  user = User.new(
    stripe_customer_id: customer.id,
    first_name: params['first_name'],
    last_name: params['last_name'],
    email: params['email']
  )
  user.save
  status 201
  content_type 'application/json'
  user.to_json
end

post '/account/user_id' do
  # Account - new account - new Subscription
end

# Login - check user password, return user and account