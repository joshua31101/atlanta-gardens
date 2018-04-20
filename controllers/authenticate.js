const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/login', function(req, res) {
  // If logged in, then redirect to home page
  if (req.session.user_type) {
    res.redirect('/');
  }
  res.render('login');
});

router.post('/login', function(req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const sql = `SELECT UserType FROM User WHERE email='${email}' AND Password=MD5('${password}')`;
  db.query(sql, function(err, result) {
    if (err) {
      res.status(500).send({error: err});
      return;
    }
    req.session.user_type = result[0].UserType;
    req.session.user_name = result[0].Username;
    res.redirect('/');
  });
});

router.get('/logout', function(req, res) {
  delete req.session.user_type;
  res.redirect('/login');
});

router.get('/owner-register', function(req, res) {
  res.render('owner/register');
});

router.post('/owner-register', function(req, res) {
  res.render('owner/register');
});

router.get('/visitor-register', function(req, res) {
  res.render('visitor/register');
});


router.post('/visitor-register', function(req, res) {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const sql = `INSERT INTO User (Username, Email, Password, UserType) VALUES ('${username}', '${email}', MD5('${password}'), "VISITOR")`;
    db.query(sql, function(err, result) {
    if (err) {
        res.status(500).send({error: err});
        return;
    }
    res.redirect('/');
    });
});


module.exports = router;
