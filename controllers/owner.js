const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/properties/:id', function(req, res) {
  const propertyId = req.params.id;
  const username = req.session.username;
  const usertype = req.session.user_type;
  var logged = 0;
  const sql1 = `SELECT * FROM
                  (SELECT * FROM AllEmails, Property WHERE AllEmails.Username = Property.Owner) q1
                      LEFT JOIN
                  (SELECT AnimalCrops.*, VisitNum, AvgRating FROM AnimalCrops, OwnerRating WHERE AnimalCrops.PropertyID = OwnerRating.ID) q2
                      ON q1.ID = q2.PropertyID WHERE q1.ID = ${propertyId} AND q2.PropertyID = ${propertyId}`;
  const sql2 = `SELECT count(1) AS num FROM Visit WHERE PropertyID = ${propertyId} AND Username = '${username}'`;
  db.query(sql1, function(err, result1) {
      if (err) {
          res.status(500).send({error: err});
          return;
      }
      console.log(result1);
      db.query(sql2, function(err, result2) {
          if (err) {
              res.status(500).send({error: err});
              return;
          }
          logged = result2[0].num;
      res.render('owner/properties', {property: result1, hasLogged: logged, type: usertype});
      });
  });
});


router.get('/view-properties', function(req, res) {
    const username = req.session.username;
    let c = req.query.col ? req.query.col : 'Username';
    let m = req.query.pattern ? req.query.pattern : '';
    let sql =  `SELECT * FROM
                    (SELECT * FROM Property WHERE Owner = '${username}') q1
                        LEFT JOIN
                    (SELECT Visit.PropertyID, count(Visit.PropertyID) AS VisitCount, avg(Visit.Rating) AS RatingNum FROM Visit GROUP BY Visit.PropertyID) q2
                        ON q1.ID = q2.PropertyID WHERE ${c} LIKE '%${m}%'`;
    if (c === 'RatingNum') {
        sql =  `SELECT * FROM
                        (SELECT * FROM Property WHERE Owner = '${username}') q1
                            LEFT JOIN
                        (SELECT Visit.PropertyID, count(Visit.PropertyID) AS VisitCount, avg(Visit.Rating) AS RatingNum FROM Visit GROUP BY Visit.PropertyID) q2
                            ON q1.ID = q2.PropertyID WHERE ${c} LIKE '${m}%'`;
    }
    if (/^\d[0-9]{0,2}-\d[0-9]{0,2}$/.test(m)) {
        var range = m.split('-');
        sql = `SELECT * FROM
                    (SELECT * FROM Property WHERE Owner = '${username}') q1
                        LEFT JOIN
                    (SELECT Visit.PropertyID, count(Visit.PropertyID) AS VisitCount, avg(Visit.Rating) AS RatingNum FROM Visit GROUP BY Visit.PropertyID) q2
                        ON q1.ID = q2.PropertyID WHERE ${c} BETWEEN ${range[0]} AND ${range[1]}`;

    }
    db.query(sql, function(err, result) {
      if (err) {
        res.status(500).send({error: err});
        return;
      }
      res.render('owner/index', {properties: result, username: username});
    });
});

router.get('/view-others', function(req, res) {
    const username = req.session.username;
    let c = req.query.col ? req.query.col : 'Username';
    let m = req.query.pattern ? req.query.pattern : '';
    let sql =  `SELECT * FROM
                    (SELECT * FROM Property WHERE Owner != '${username}' AND ApprovedBy IS NOT NULL) q1
                        LEFT JOIN
                    (SELECT Visit.PropertyID, count(Visit.PropertyID) AS VisitCount, avg(Visit.Rating) AS RatingNum FROM Visit GROUP BY Visit.PropertyID) q2
                        ON q1.ID = q2.PropertyID WHERE ${c} LIKE '%${m}%'`;
    if (c === 'RatingNum') {
        sql =  `SELECT * FROM
                        (SELECT * FROM Property WHERE Owner != '${username}' AND ApprovedBy IS NOT NULL) q1
                            LEFT JOIN
                        (SELECT Visit.PropertyID, count(Visit.PropertyID) AS VisitCount, avg(Visit.Rating) AS RatingNum FROM Visit GROUP BY Visit.PropertyID) q2
                            ON q1.ID = q2.PropertyID WHERE ${c} LIKE '${m}%'`;
    }
    if (c === 'Public') {
        if (m == 1) {
            sql =  `SELECT * FROM
                            (SELECT * FROM Property WHERE Owner != '${username}' AND ApprovedBy IS NOT NULL AND IsPublic IS True) q1
                                LEFT JOIN
                            (SELECT Visit.PropertyID, count(Visit.PropertyID) AS VisitCount, avg(Visit.Rating) AS RatingNum FROM Visit GROUP BY Visit.PropertyID) q2
                                ON q1.ID = q2.PropertyID`;
        } else {
            sql =  `SELECT * FROM
                            (SELECT * FROM Property WHERE Owner != '${username}' AND ApprovedBy IS NOT NULL AND IsPublic IS False) q1
                                LEFT JOIN
                            (SELECT Visit.PropertyID, count(Visit.PropertyID) AS VisitCount, avg(Visit.Rating) AS RatingNum FROM Visit GROUP BY Visit.PropertyID) q2
                                ON q1.ID = q2.PropertyID`;
        }
    }
    if (/^\d[0-9]{0,2}-\d[0-9]{0,2}$/.test(m)) {
        var range = m.split('-');
        sql = `SELECT * FROM
                    (SELECT * FROM Property WHERE Owner != '${username}' AND ApprovedBy IS NOT NULL) q1
                        LEFT JOIN
                    (SELECT Visit.PropertyID, count(Visit.PropertyID) AS VisitCount, avg(Visit.Rating) AS RatingNum FROM Visit GROUP BY Visit.PropertyID) q2
                        ON q1.ID = q2.PropertyID WHERE ${c} BETWEEN ${range[0]} AND ${range[1]}`;

    }
    db.query(sql, function(err, result) {
      if (err) {
        res.status(500).send({error: err});
        return;
      }
      res.render('properties/others', {properties: result, username: username});
    });
});

module.exports = router;
