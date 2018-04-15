const express = require("express"),
      bodyParser = require('body-parser'),
      url = require('url'),
      app = express(),
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

app.use(require('./controllers'));

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(function(req, res, next) {
  const currentUrl = url.parse(req.url).pathname;
  if (req.session.user_id) {
    if (currentUrl === '/login') {
      return res.redirect('/');
    }
  } else if (currentUrl !== '/login') {
    return res.redirect('/login');
  }
  next();
});

app.listen(port, function () {
  console.log('listening on http://localhost:' + port);
});
