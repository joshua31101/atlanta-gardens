const express = require('express');
const router = express.Router();
const db = require('./db');

router.post('/:id', function(req, res) {

});

router.get('/:id', function(req, res) {
    const propertyId = req.params.id;
    const sql1 = `SELECT * FROM Property WHERE ID = ${propertyId}`;
    const sql2 = `SELECT Email FROM User WHERE Username IN (SELECT Owner FROM Property WHERE ID = ${propertyId})`;
    const sql3 = `SELECT count(PropertyID) AS VisitCount, avg(Rating) AS AvgRating FROM Visit WHERE PropertyID = ${propertyId}`;
    const sql4 = `SELECT ItemName FROM Has WHERE PropertyID = ${propertyId}`;
    db.query(sql1, function(err, result1) {
        if (err) {
            res.status(500).send({error: err});
            return;
        }
        db.query(sql2, function(err, result2) {
            if (err) {
                res.status(500).send({error: err});
                return;
            }
            db.query(sql3, function(err, result3) {
                if (err) {
                    res.status(500).send({error: err});
                    return;
                }
                db.query(sql4, function(err, result4) {
                    if (err) {
                        res.status(500).send({error: err});
                        return;
                    }
                    res.render('properties/index', {property: result1[0], email: result2[0], visits: result3[0], crops: result4});
                });
            });
        });
    });
});

module.exports = router;
