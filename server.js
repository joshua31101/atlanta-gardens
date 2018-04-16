const express = require("express"),
      bodyParser = require('body-parser'),
      url = require('url'),
      app = express(),
      path = require('path');
      session = require('express-session'),
      port = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  // Cookie Options
  duration: 24 * 60 * 60 * 1000,// 24 hours
}));

app.use(express.static(path.join(__dirname, 'public')));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use('/', require('./controllers/index'));

app.listen(port, function () {
  console.log('listening on http://localhost:' + port);
});
