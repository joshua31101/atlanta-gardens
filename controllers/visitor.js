const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/', function(req, res) {
  res.render('visitor/index');
});

router.get('/history', function(req, res) {
  res.render('visitor/history');
});



module.exports = router;
