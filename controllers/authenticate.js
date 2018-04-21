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
  const sql = `SELECT UserType, Username FROM User WHERE email='${email}' AND Password=MD5('${password}')`;
  db.query(sql, function(err, result) {
    if (err) {
      res.status(500).send({error: err});
      return;
    }
    req.session.user_type = result[0].UserType;
    req.session.name = result[0].Username;
    res.redirect('/');
  });
});

router.get('/logout', function(req, res) {
  delete req.session.user_type;
  res.redirect('/login');
});


module.exports = router;
