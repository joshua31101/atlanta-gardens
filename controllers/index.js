const express = require('express'),
      router = express.Router(),
      mysql = require('mysql2');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// create connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) throw err;
  console.log('Mysql connected...');
});

router.get('/', function(req, res) {
  if (req.session.user_type === 'admin') {
    // Redirect to admin page
    res.render('admin');
  } else if (req.session.user_type === 'visitor') {
    // Redirect to visitor page
  } else if (req.session.user_type === 'owner') {
    // Redirect to owner page
  } else {
    res.redirect('login');
  }
});

router.get('/login', function(req, res) {
  res.render('login');
});

router.post('/login', function(req, res) {
  // temp data for testing
  req.session.user_id = 1;
  req.session.user_type = 'admin';
  res.redirect('/');
});

router.get('/logout', function(req, res) {
  delete req.session.user_id;
  delete req.session.user_type;
  res.redirect('/login');
});

router.get('/visitor-register', function(req, res) {
  res.render('visitorRegister');
});

router.get('/owner-register', function(req, res) {
  res.render('ownerRegister');
});

router.post('/visitor-register', function(req, res) {
  res.render('visitorRegister');
});

router.post('/owner-register', function(req, res) {
  res.render('ownerRegister');
});

router.get('/owner', function(req, res) {
  res.render('owner/index');
});


module.exports = router;
