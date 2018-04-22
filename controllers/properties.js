const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/view/:id', function(req, res) {
    const propertyId = req.params.id;
    const username = req.session.username;
    const usertype = req.session.user_type;
    var logged = 0;
    const sql1 = `SELECT * FROM
                    (SELECT * FROM AllEmails, AllProperties WHERE AllEmails.Username = AllProperties.Owner) q1
                        LEFT JOIN
                    (SELECT AnimalCrops.*, VisitNum, AvgRating FROM AnimalCrops, VisitRating WHERE AnimalCrops.PropertyID = VisitRating.PropertyID) q2
                        ON q1.ID = q2.PropertyID WHERE q1.ID = ${propertyId} AND q2.PropertyID = ${propertyId}`;
    const sql2 = `SELECT count(1) AS num FROM Visit WHERE PropertyID = ${propertyId} AND Username = '${username}'`;
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
            logged = result2[0].num;
        res.render('properties/index', {property: result1, hasLogged: logged, type: usertype});
        });
    });
});

router.get('/view', function(req, res) {
    let c = req.query.col ? req.query.col : 'Username';
    let m = req.query.pattern ? req.query.pattern : '';
    let sql = `
        SELECT Name, City, PropertyType (SELECT COUNT(*) FROM Visit WHERE Visit.Username=User.Username) as visits
        FROM User
        WHERE UserType='VISITOR' AND ${c} LIKE '%${m}%'`;

    if (c === 'visits') {
        sql = `
            SELECT Property_List.Username, Property_List.Email, Property_List   .visits FROM
            (SELECT Username, Email, (SELECT COUNT(*) FROM Visit WHERE Visit.Username=User.Username) AS visits
            FROM User
            WHERE UserType='VISITOR') AS User_Visit
            WHERE User_Visit.visits=${m};`;
    }

    db.query(sql, function(err, result) {
      if (err) {
        res.status(500).send({error: err});
        return;
      }
      res.render('visitors/index', {visitors: result});
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
    WHERE Owner <> '${username}' AND p.ApprovedBy IS NOT NULL
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
    const username = req.session.username;
    // validate rating range
    const sql = `INSERT INTO Visit (Username, PropertyID, VisitDate, Rating) Values ('${username}', '${propertyId}', NOW(), ${rating}) ON DUPLICATE KEY UPDATE VisitDate= NOW(), Rating=${rating}`;
    db.query(sql, function(err, result) {
      if (err) {
        res.status(500).send({error: err});
        return;
      }
      res.redirect(`view/${propertyId}`);
  })
});

router.post('/visit-unlog', function(req, res) {
    const { rating, propertyId } = req.body;
    const username = req.session.username;
    const sql = `DELETE FROM Visit WHERE Username = '${username}' AND PropertyID = ${propertyId}`;
    db.query(sql, function(err, result) {
      if (err) {
        res.status(500).send({error: err});
        return;
      }
      res.redirect(`view/${propertyId}`);
  })
});
module.exports = router;
