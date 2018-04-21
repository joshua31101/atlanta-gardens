const express = require('express');
const router = express.Router();
const db = require('./db');

router.post('/:id', function(req, res) {
    const rating = req.params.rating;
    const propertyId = req.params.id;
    const name = req.session.name;
    const sql = `INSERT INTO Visit (Username, PropertyID, Rating) Values ('name', propertyId, rating) ON DUPLICATE KEY UPDATE Rating= 5`;
    db.query(sql, function(err, result) {
      if (err) {
        res.status(500).send({error: err});
        return;
      }
  });
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

router.post('/visit-rating', function(req, res) {
    const { rating, propertyId } = req.body;
    const username = req.session.name;
    const dateObj = new Date();
    const month = dateObj.getUTCMonth() + 1;
    const day = dateObj.getUTCDate();
    const year = dateObj.getUTCFullYear();
    const newdate = year + "-" + month + "-" + day;
    // validate rating range
        const sql = `INSERT INTO Visit (Username, PropertyID, VisitDate, Rating) Values ('${username}', '${propertyId}', ${rating}) ON DUPLICATE KEY UPDATE Rating=${rating}`;
    db.query(sql, function(err, result) {
      if (err) {
        res.status(500).send({error: err});
        return;
      }
      res.redirect(`/${propertyId}`);
  })
});

module.exports = router;
