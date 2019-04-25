require 'stripe'
require 'dotenv'
require 'json'
require_relative './models.rb'

Dotenv.load(File.dirname(__FILE__) + '/../../.env')
Stripe.api_key = ENV['STRIPE_SECRET_KEY']

module UsageFaker
  def self.fake_usage
    # Get all active accounts
    Account.where(status: 'Active').each do |account|
      begin
        usage = Usage.new(
          account_id: account.id,
          quantity: rand(20),
          date: DateTime.now.to_date
        )
        usage.save
        # Get the subscription item to add usage to
        subscription = Stripe::Subscription.retrieve(account.stripe_subscription_id)
        subscription_item = subscription['items']['data'][0]['id']
        Stripe::UsageRecord.create({
          quantity: usage.quantity,
          timestamp: DateTime.now.to_time.to_i,
          subscription_item: subscription_item,
        })
        Stripe::Subscription.delete(subscription['id'],{
          invoice_now: "true",
          prorate: "false"
        })
      end
    end

    # Cancel Subscriptions to open invoices
  end
end