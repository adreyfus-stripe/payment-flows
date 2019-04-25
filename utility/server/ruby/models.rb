require_relative './db.rb'

# We initialize the Database (Create the tables here)
Sequel::Model.plugin :json_serializer
RocketFuelDB.init

class User < Sequel::Model
end

class Account < Sequel::Model
end

class Usage < Sequel::Model(:usage)
end