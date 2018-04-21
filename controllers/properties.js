const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/view/:id', function(req, res) {
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

router.get('/new', function(req, res) {
  const farmItemQuery = `SELECT * FROM FarmItem WHERE IsApproved=1 ORDER BY Type`;
  db.query(farmItemQuery, function(err, result) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('/new');
    }
    let animals = [];
    let orchardCrops = [];
    let gardenCrops = [];
    result.forEach(function(elem) {
      if (elem.Type === 'ANIMAL') {
        animals.push(elem);
      } else if (elem.Type === 'FRUIT' || elem.Type === 'NUT') {
        orchardCrops.push(elem);
      } else {
        gardenCrops.push(elem);
      }
    });

    res.render('properties/new', {
      animals: animals,
      orchardCrops: orchardCrops,
      gardenCrops: gardenCrops
    });
  });
});

router.post('/new', function(req, res) {
  const {
    propertyName,
    streetAddress,
    city,
    zip,
    acres,
    propertyType,
    crop,
    animal,
    isPublic,
    isCommercial,
  } = req.body;
  const username = req.session.username;

  if (propertyType === 'Farm') {
    if (!animal || !crop) {
      req.flash('error', 'Farm must have an animal and a crop.');
      return res.redirect('new');
    }
  } else {
    if (!crop) {
      req.flash('error', 'Garden or orchard must have a crop.');
      return res.redirect('new');
    }
  }

  let sql = `
    INSERT INTO Property(
      ID,
      Name,
      Size,
      IsCommercial,
      IsPublic,
      Street,
      City,
      Zip,
      PropertyType,
      Owner,
      ApprovedBy
    ) SELECT
      MAX(ID) + 1,
      '${propertyName}',
      ${acres},
      ${isCommercial},
      ${isPublic},
      '${streetAddress}',
      '${city}',
      ${zip},
      '${propertyType}',
      '${username}',
      NULL
    FROM Property
  `;
  db.query(sql, function(err, result) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('new');
    }
    const newPropertyId = result.insertId;
    if (propertyType === 'Farm') {
      sql = `INSERT INTO Has VALUES(${newPropertyId},	'${animal}');`
      db.query(sql, function(er, r) {
        if (err) {
          req.flash('error', er);
          return res.redirect('new');
        }
      });
    } else {
      sql = `INSERT INTO Has VALUES(${newPropertyId},	'${crop}');`
      db.query(sql, function(er, r) {
        if (err) {
          req.flash('error', err);
          return res.redirect('properties/new');
        }
      });
    }
    return res.redirect('/');
  });

});

router.get('/others', function(req, res) {
  const username = req.session.username;
  let sql = `
    SELECT p.*, COUNT(v.PropertyID) AS Visit_count, AVG(v.Rating) AS Visit_rating
    FROM Property AS p
    LEFT JOIN Visit AS v ON p.ID = v.PropertyID
    WHERE Owner <> '${username}' AND p.ApprovedBy IS NULL
    GROUP BY p.ID;
  `;
  db.query(sql, function(err, result) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('/');
    }
    res.render('properties/others', {
      properties: result
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
