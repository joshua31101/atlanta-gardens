const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/:id', function(req, res) {
  const propertyId = req.params.id;
  const sql = `SELECT * FROM Property WHERE ID = ${propertyId}`;
  db.query(sql, function(err, result) {
    if (err) {
      res.status(500).send({error: err});
      return;
    }
    res.render('properties/index', {property: result[0]});
  });
});

module.exports = router;
