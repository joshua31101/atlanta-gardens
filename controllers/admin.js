const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/', function(req, res) {
  res.render('visitor/index');
});

router.get('/view-visitors', function(req, res) {
    const sql = `SELECT Username, Email, Password FROM User WHERE UserType="VISITOR"`;
    db.query(sql, function(err, result) {
      if (err) {
        res.status(500).send({error: err});
        return;
      }
      console.log(result);
      res.render('admin/visitors', {visitors: result});
    });
});

router.get('/view-owners', function(req, res) {

});

// router.get('/')


module.exports = router;
