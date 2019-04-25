require 'sequel'

module RocketFuelDB
  # This module creates a SQLlite database for the RocketFuel Demo but this could be MySQL, Postgres, anytime you like
  DB = Sequel.connect('sqlite://rocketfuel.db')

  def self.init
    puts "Initializing Database"
    # DB.drop_table?('users')
    DB.transaction do
      # users
      DB.run(
        "CREATE TABLE IF NOT EXISTS user (
          id INTEGER PRIMARY KEY ASC,
          email TEXT,
          first_name TEXT,
          last_name TEXT,
          stripe_customer_id TEXT
          )"
      )
      # accounts
      DB.run(
        "CREATE TABLE IF NOT EXISTS account (
          id INTEGER PRIMARY KEY ASC,
          user_id INTEGER,
          stripe_subscription_id TEXT,
          FOREIGN KEY(user_id) REFERENCES account(id) 
          )"
      )
    end
  end
end