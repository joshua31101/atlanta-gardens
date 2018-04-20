const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/', function(req, res) {
  res.render('visitor/index');
});

router.get('/:name', function(req, res) {
    const name = req.params.name;
    const sql = `SELECT Property.ID AS ID, Property.Name AS Name, Visit.VisitDate AS Date, Visit.Rating AS Rating FROM Property, Visit WHERE Visit.Username = '${name}' AND Visit.PropertyID = Property.ID`;
    db.query(sql, function(err, result) {
        if (err) {
            res.status(500).send({error: err});
            return;
        }
        //fix if no visit history
        res.render('visitor/history', {visits: result});
    });
});



module.exports = router;
