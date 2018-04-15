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
  // If logged in, then render home page
  if (req.session.user_type) {
    if (req.session.user_type === 'ADMIN') {
      // Redirect to admin page
      res.render('admin/index');
    } else if (req.session.user_type === 'VISITOR') {
      // Redirect to visitor page
      res.render('visitor/index');
    } else if (req.session.user_type === 'OWNER') {
      // Redirect to owner page
      res.render('owner/index');
    }
  } else {
    res.redirect('login');
  }
});

router.get('/login', function(req, res) {
  res.render('login');
});

router.post('/login', function(req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const sql = `SELECT UserType FROM User WHERE email='${email}' AND Password=MD5('${password}')`;
  console.log(sql);
  db.query(sql, function(err, result) {
    if (err) {
      res.status(500).send({error: err});
      return;
    }
    req.session.user_type = result[0].UserType;
    res.redirect('/');
  });

});

router.get('/logout', function(req, res) {
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


module.exports = router;
