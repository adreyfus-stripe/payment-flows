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
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY ASC,
          email TEXT,
          first_name TEXT,
          last_name TEXT,
          stripe_customer_id TEXT,
          password BLOB
          )`
      );
      console.log('New table users created!');

      db.run(
        `CREATE TABLE IF NOT EXISTS accounts (
          id INTEGER PRIMARY KEY ASC,
          user_id INTEGER,
          stripe_subscription_id TEXT,
          FOREIGN KEY(user_id) REFERENCES account(id) 
          )`
      );
      console.log('New table accounts created!');
    } else {
      console.log('Databases ready to go!');
    }
  });
};

const createUser = params => {
  const {email, first_name, last_name, stripe_customer_id, password} = params;
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO users 
        (email, first_name, last_name, stripe_customer_id, password) 
      VALUES 
        ('${email}', '${first_name}', '${last_name}', '${stripe_customer_id}', $password)`,
      {
        $password: password,
      },
      function(err) {
        if (!err) {
          resolve({
            email,
            first_name,
            last_name,
            stripe_customer_id,
            id: this.lastID,
          });
        } else {
          reject(err);
        }
      }
    );
  });
};

const retrieveUser = async params => {
  const {id, email} = params;
  const filterName = id ? 'id' : 'email';
  const filter = id ? id : email;
  return new Promise(resolve => {
    db.get(`SELECT * from users WHERE ${filterName} = '${filter}'`, function(
      err,
      user
    ) {
      if (err) {
        resolve({err});
      } else {
        resolve({user});
      }
    });
  });
};

exports.db = {
  init,
  createUser,
  retrieveUser,
};
