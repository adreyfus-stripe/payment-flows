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
        "CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY ASC,
          email TEXT,
          first_name TEXT,
          last_name TEXT,
          stripe_customer_id TEXT
          )"
      )
      # accounts
      DB.run(
        "CREATE TABLE IF NOT EXISTS accounts (
          id INTEGER PRIMARY KEY ASC,
          user_id INTEGER,
          status TEXT,
          stripe_subscription_id TEXT,
          FOREIGN KEY(user_id) REFERENCES users(id) 
          )"
      )
      # usage
      DB.run(
        "CREATE TABLE IF NOT EXISTS usage (
          id INTEGER PRIMARY KEY ASC,
          account_id INTEGER,
          quantity INTEGER,
          date DATE,
          FOREIGN KEY(account_id) REFERENCES accounts(id)
        )"
      )
      # bills
      DB.run("
        CREATE TABLE IF NOT EXISTS bills (
          id INTEGER PRIMARY KEY ASC,
          account_id INTEGER,
          status TEXT,
          stripe_invoice_id INTEGER,
          last_update_date DATE,
          usage_id INTEGER,
          FOREIGN KEY(account_id) REFERENCES accounts(id),
          FOREIGN KEY(usage_id) REFERENCES usage(id)
        )
        ")
    end
  end
end