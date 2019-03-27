const express = require("express");
const app = express();
const { resolve } = require("path");
require('dotenv').config();

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("../../client"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  const path = resolve("../../client/index.html");
  response.sendFile(path);
});

// listen for requests :)
const listener = app.listen(process.env.PORT || 3000, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
