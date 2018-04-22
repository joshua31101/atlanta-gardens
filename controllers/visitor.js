const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/', function(req, res) {
  res.render('visitor/index');
});

router.get('/log/:name', function(req, res) {
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

router.get('/history/sort', function(req, res) {
    const username = req.session.username;
    const sortByCol = req.query.sortBy;
    const sortOrder = req.query.sortOrder;
    const sql = `
      SELECT
        Property.ID AS ID,
        Property.Name AS Name,
        Visit.VisitDate AS Date,
        Visit.Rating AS Rating
      FROM Property, Visit
      WHERE Visit.Username = '${username}' AND Visit.PropertyID = Property.ID ORDER BY ${sortByCol} ${sortOrder}`;
    db.query(sql, function(err, result) {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.status(200).send({
        history: result
      });
    });
});

router.get('/sort', function(req, res) {
  const sortByCol = req.query.sortBy;
  const sortOrder = req.query.sortOrder;
  const sql = `SELECT * FROM
                  (SELECT * FROM Property WHERE IsPublic = True AND ApprovedBy IS NOT NULL) q1
                      LEFT JOIN
                  (SELECT Visit.PropertyID, count(Visit.PropertyID) AS VisitCount, avg(Visit.Rating) AS RatingNum FROM Visit GROUP BY Visit.PropertyID) q2
                      ON q1.ID = q2.PropertyID ORDER BY ${sortByCol} ${sortOrder}`;
  db.query(sql, function(err, result) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.status(200).send({
      properties: result
    });
  });
});


module.exports = router;
