// This module creates a SQLlite database for the RocketFuel Demo but this could be MySQL, Postgres, anything you like.
'use strict';

// init sqlite db
const fs = require('fs');
const dbFile = './rocketfuel.db';
const exists = fs.existsSync(dbFile);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbFile);

const init = _ => {
  // if ./rocketfuel.db does not exist, create it, otherwise print records to console
  db.serialize(function() {
    if (!exists) {
      db.run(
        `CREATE TABLE IF NOT EXISTS user (
          id INTEGER PRIMARY KEY ASC,
          email TEXT,
          first_name TEXT,
          last_name TEXT,
          stripe_customer_id TEXT
          )`
      );
      console.log('New table user created!');

      db.run(
        `CREATE TABLE IF NOT EXISTS account (
          id INTEGER PRIMARY KEY ASC,
          user_id INTEGER,
          stripe_subscription_id TEXT,
          FOREIGN KEY(user_id) REFERENCES account(id) 
          )`
      );
      console.log('New table account created!');
    } else {
      console.log('Databases ready to go!');
    }
  });
};

exports.db = {
  init,
};
