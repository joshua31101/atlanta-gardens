const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/sort', function(req, res) {
  const sortByCol = req.query.sortBy;
  const sortOrder = req.query.sortOrder;
  const username = req.session.username;
  let sql = `SELECT * FROM Property WHERE Owner='${username}' ORDER BY ${sortByCol} ${sortOrder}`;
  db.query(sql, function(err, result) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('/');
    }
    res.status(200).send({
      properties: result
    });
  });
});

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
    const username = req.session.username;
    let c = req.query.col ? req.query.col : 'Username';
    let m = req.query.pattern ? req.query.pattern : '';
    let sql =  `SELECT * FROM
                    (SELECT * FROM Property WHERE IsPublic = True AND ApprovedBy IS NOT NULL) q1
                        LEFT JOIN
                    (SELECT Visit.PropertyID, count(Visit.PropertyID) AS VisitCount, avg(Visit.Rating) AS RatingNum FROM Visit GROUP BY Visit.PropertyID) q2
                        ON q1.ID = q2.PropertyID WHERE ${c} LIKE '%${m}%'`;
    if (c === 'RatingNum') {
        sql =  `SELECT * FROM
                        (SELECT * FROM Property WHERE IsPublic = True AND ApprovedBy IS NOT NULL) q1
                            LEFT JOIN
                        (SELECT Visit.PropertyID, count(Visit.PropertyID) AS VisitCount, avg(Visit.Rating) AS RatingNum FROM Visit GROUP BY Visit.PropertyID) q2
                            ON q1.ID = q2.PropertyID WHERE ${c} LIKE '${m}%'`;
    }
    if (/^\d[0-9]{0,2}-\d[0-9]{0,2}$/.test(m)) {
        var range = m.split('-');
        sql = `SELECT * FROM
                    (SELECT * FROM Property WHERE IsPublic = True AND ApprovedBy IS NOT NULL) q1
                        LEFT JOIN
                    (SELECT Visit.PropertyID, count(Visit.PropertyID) AS VisitCount, avg(Visit.Rating) AS RatingNum FROM Visit GROUP BY Visit.PropertyID) q2
                        ON q1.ID = q2.PropertyID WHERE ${c} BETWEEN ${range[0]} AND ${range[1]}`;

    }
    db.query(sql, function(err, result) {
      if (err) {
        res.status(500).send({error: err});
        return;
      }
      res.render('visitor/index', {propertiesList: result, user: username});
    });
});

router.get('/sort', function(req, res) {
    const value = req.query.name;
    console.log(value);
    const sql = `SELECT * FROM
                    (SELECT * FROM Property WHERE IsPublic = True AND ApprovedBy IS NOT NULL) q1
                        LEFT JOIN
                    (SELECT Visit.PropertyID, count(Visit.PropertyID) AS VisitCount, avg(Visit.Rating) AS RatingNum FROM Visit GROUP BY Visit.PropertyID) q2
                        ON q1.ID = q2.PropertyID ORDER BY `;
})

router.get('/new', function(req, res) {
  const farmItemQuery = `SELECT * FROM FarmItem WHERE IsApproved=1 ORDER BY Type`;
  db.query(farmItemQuery, function(err, result) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('new');
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

  if (propertyType === 'FARM') {
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
    if (propertyType === 'FARM') {
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
          return res.redirect('new');
        }
      });
    }
    return res.redirect('/');
  });

});

router.get('/others', function(req, res) {
  const username = req.session.username;
  let sql = `
    SELECT p.*, COUNT(v.PropertyID) AS VisitCount, AVG(v.Rating) AS RatingNum
    FROM Property AS p
    LEFT JOIN Visit AS v ON p.ID = v.PropertyID
    WHERE Owner <> '${username}' AND p.ApprovedBy IS NOT NULL
    GROUP BY p.ID;
  `;
  db.query(sql, function(err, result) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('other');
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

router.get('/edit/:id', function(req, res) {
  const propertyId = req.params.id;
  let sql = `
    SELECT
      ID as PropertyId,
      p.Name AS PropertyName,
      Size,
      IsCommercial,
      IsPublic,
      Street,
      City,
      Zip,
      PropertyType,
      Has_FarmItem.Name AS ItemName,
      Has_FarmItem.Type AS ItemType
    FROM Property AS p
    INNER JOIN (
    SELECT * FROM FarmItem AS f
    INNER JOIN Has AS h ON f.Name = h.ItemName
    WHERE f.IsApproved = 1
    ) AS Has_FarmItem ON Has_FarmItem.PropertyID = p.ID
    WHERE p.ID = ${propertyId};
  `;
  db.query(sql, function(err, result) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect(`/properties/edit/${propertyId}`);
    }
    const propertyType = result[0].PropertyType;
    let farmItemQuery = `
      SELECT
        Name AS ItemName,
        Type AS ItemType
      FROM FarmItem WHERE IsApproved=1 `;
    if (propertyType === 'GARDEN') {
      farmItemQuery += `AND Type IN ('FLOWER', 'VEGETABLE')`;
    } else if (propertyType === 'ORCHARD') {
      farmItemQuery += `AND Type IN ('FRUIT', 'NUT')`;
    } else {
      farmItemQuery += `ORDER BY Type`;
    }
    db.query(farmItemQuery, function(err, itemResult) {
      if (err) {
        req.flash('error', err.message);
        return res.redirect(`/properties/edit/${propertyId}`);
      }
      let animals = {};
      let crops = {};
      itemResult.forEach(function(elem) {
        if (elem.ItemType === 'ANIMAL') {
          animals[elem.ItemName] = 0;
        } else {
          crops[elem.ItemName] = 0;
        }
      });

      // Flag 1 for already selected crops
      result.forEach(function(propertyItem) {
        if (propertyItem.ItemType === 'ANIMAL') {
          animals[propertyItem.ItemName] = 1;
        } else {
          crops[propertyItem.ItemName] = 1;
        }
      });

      res.render('properties/edit', {
        property: result[0],
        animals: animals,
        crops: crops,
      });
    });
  });
});

router.post('/edit/:id', function(req, res) {
  let {
    propertyName,
    streetAddress,
    city,
    zip,
    acres,
    propertyType,
    crops,
    animals,
    isPublic,
    isCommercial,
  } = req.body;
  const propertyId = Number(req.params.id);
  const username = req.session.username;

  if (typeof animals === 'string') {
    animals = [animals];
  }
  if (typeof crops === 'string') {
    crops = [crops];
  }

  if (propertyType === 'FARM') {
    if (!animals || !crops || (animals && !animals.length) || (crops && !crops.length)) {
      req.flash('error', 'Farm must have both an animal and a crop.');
      return res.redirect(`/properties/edit/${propertyId}`);
    }
  } else {
    if (!crops || (crops && !crops.length)) {
      req.flash('error', 'Garden or orchard must have a crop.');
      return res.redirect(`/properties/edit/${propertyId}`);
    }
  }

  let sql = `
    UPDATE Property
    SET
      ID = ${propertyId},
      Name = '${propertyName}',
      Size = ${acres},
      IsCommercial = ${isCommercial},
      IsPublic = ${isPublic},
      Street = '${streetAddress}',
      City = '${city}',
      Zip = ${zip}
    WHERE ID = ${propertyId}
  `;
  db.query(sql, function(err, result) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect(`/properties/edit/${propertyId}`);
    }

    let removedItems = [];
    let newItems = [];
    let items = {};
    sql = `SELECT * FROM Has WHERE PropertyID = ${propertyId}`;
    db.query(sql, function(er, hasResult) {
      if (er) {
        req.flash('error', er);
        return res.redirect(`/properties/edit/${propertyId}`);
      }
      hasResult.forEach(function(has) {
        items[has.ItemName] = 0;
      });

      crops.concat(animals).forEach(function(newItem) {
        if (items[newItem] === 0) {
          delete items[newItem];
        } else {
          items[newItem] = 1;
        }
      });

      Object.keys(items).forEach(function(item) {
        if (items[item]) {
          newItems.push(item);
        } else {
          removedItems.push(item);
        }
      });

      if (removedItems) {
        let deletedItems = [];
        sql = `DELETE FROM Has WHERE (PropertyId, ItemName) IN (?)`;
        removedItems.forEach(function(item) {
          deletedItems.push([propertyId, item]);
        });
        db.query(sql, [deletedItems], function(er1, deletedResult) {
          if (err) {
            req.flash('error', er);
            return res.redirect(`/properties/edit/${propertyId}`);
          }
        });
      }

      if (newItems) {
        let addedItems = [];
        sql = `INSERT INTO Has VALUES ?`;
        newItems.forEach(function(item) {
          addedItems.push([propertyId, item]);
        });
        db.query(sql, [addedItems], function(er1, addedResult) {
          if (err) {
            req.flash('error', er);
            return res.redirect(`/properties/edit/${propertyId}`);
          }
        });
      }
      req.flash('success', 'Successfully updated!');
      return res.redirect(`/properties/edit/${propertyId}`);
    });
  });
});

router.post('/:id/crop/new', function(req, res) {
  const { cropName, cropType } = req.body;
  const propertyId = req.params.id;
  let sql = `INSERT INTO FarmItem VALUES('${cropName}',	FALSE, '${cropType}')`;
  db.query(sql, function(err, result) {
    if (err) {
      req.flash('error', er);
      return res.redirect(`/properties/edit/${propertyId}`);
    }
    req.flash('success', 'Successfully requested a crop ' + cropName);
    return res.redirect(`/properties/edit/${propertyId}`);
  });
});




module.exports = router;
