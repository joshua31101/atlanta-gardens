const express = require('express');
const router = express.Router();
const db = require('./db');

// router.get('/', function(req, res) {
//   res.render('visitor/index');
// });

router.get('/view-visitors', function(req, res) {
    let c = req.query.col ? req.query.col : 'Username';
    let m = req.query.pattern ? req.query.pattern : '';
    let sql = `
        SELECT Username, Email, (SELECT COUNT(*) FROM Visit WHERE Visit.Username=User.Username) as visits 
        FROM User
        WHERE UserType='VISITOR' AND ${c} LIKE '%${m}%'`;

    if (c === 'visits') {
        sql = `
            SELECT User_Visit.Username, User_Visit.Email, User_Visit.visits FROM
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
      res.render('admin/visitors', {visitors: result});
    });
});

router.get('/visitor/:visitor', function(req, res) {
  const visitorUsername = req.params.visitor;
    const sql = `
        SELECT Username, Email, (SELECT COUNT(*) FROM Visit WHERE Visit.Username=User.Username) as visits 
        FROM User
        WHERE User.UserType="VISITOR" AND User.Username = '${visitorUsername}' `;
    const sqlVisits = `
        SELECT PropertyID, VisitDate, Rating
        FROM Visit
        WHERE Username='${visitorUsername}'
    `;
    db.query(sql, function(err, visitor) {
      if (err) {
        res.status(500).send({error: err});
        return;
      }
        db.query(sqlVisits, function (err, result) {
          if (err) {
            res.status(500).send({error: err});
            return;
          }
            res.render('admin/visitor', {visitor: visitor[0], visits: result});
        })
  });
});

router.get('/delete-user/:visitor', function(req, res) {
  const visitorUsername = req.params.visitor;
  const sql = `DELETE FROM User WHERE Username='${visitorUsername}'`;
  db.query(sql, function(err, result) {
    if (err) {
      res.status(500).send({error: err});
      return;
    }
    res.render('admin/index', {user: req.session.name});
  });
});

router.get('/delete-log/:visitor', function(req, res) {
    const visitorUsername = req.params.visitor;
    const sql = `DELETE FROM Visit WHERE Username='${visitorUsername}'`;
    db.query(sql, function(err, result) {
        if (err) {
            res.status(500).send({error: err});
            return;
        }
        res.render('admin/index', {user: req.session.name});
    });
});

router.get('/view-owners', function(req, res) {
    let c = req.query.col ? req.query.col : 'Username';
    let m = req.query.pattern ? req.query.pattern : '';
    let sql = `
        SELECT Username, Email, (SELECT COUNT(*) FROM Property WHERE Property.Owner=User.Username) AS properties
        FROM User
        WHERE UserType='OWNER' AND ${c} LIKE '%${m}%'`;

    if (c === 'properties') {
        sql = `
            SELECT User_Prop.Username, User_Prop.Email, User_Prop.properties FROM
            (SELECT Username, Email, (SELECT COUNT(*) FROM Property WHERE Property.Owner=User.Username) AS properties
            FROM User
            WHERE UserType='OWNER') AS User_Prop
            WHERE User_Prop.properties=${m};`;
    }

    db.query(sql, function(err, result) {
        if (err) {
            res.status(500).send({error: err});
            return;
        }
        res.render('admin/owners', {owners: result});
    });
});

router.get('/owner/:owner', function(req, res) {
    const ownerUsername = req.params.owner;
    const sql = `
        SELECT Username, Email, (SELECT COUNT(*) FROM Property WHERE Property.Owner=User.Username) as properties 
        FROM User
        WHERE User.Username = '${ownerUsername}'`;
    const sqlProperties = `
        SELECT ID, Name, Size, IsCommercial, IsPublic, Street, City, Zip, PropertyType, ApprovedBy
        FROM Property
        WHERE Owner='${ownerUsername}'
    `;
    db.query(sql, function(err, owners) {
        if (err) {
            res.status(500).send({error: err});
            return;
        }
        db.query(sqlProperties, function (err, result) {
            if (err) {
                res.status(500).send({error: err});
                return;
            }
            res.render('admin/owner', {owner: owners[0], properties: result});
        })
    });
});

router.get('/confirmed-properties', function (req, res) {
    let c = req.query.col ? req.query.col : 'Name';
    let m = req.query.pattern ? req.query.pattern : '';

    let sql = `
        SELECT p.*, AVG(v.Rating) as avgRating
        FROM Property AS p
        LEFT JOIN Visit AS v ON p.ID = v.PropertyID
        WHERE p.ApprovedBy IS NOT NULL AND p.${c} LIKE '%${m}%'
        GROUP BY p.ID`;
    if (c === 'Zip' || c === 'Size' || c === 'ID' || c === 'avgRating') {
        sql = `
        SELECT * FROM
        (SELECT p.*, AVG(v.Rating) as avgRating
        FROM Property AS p
        LEFT JOIN Visit AS v ON p.ID = v.PropertyID
        WHERE p.ApprovedBy IS NOT NULL
        GROUP BY p.ID) AS Prop
        WHERE Prop.${c}=${m}`;
    }

    db.query(sql, function(err, result) {
        if (err) {
            res.status(500).send({error: err});
            return;
        }
        res.render('admin/confirmedProperties', {properties: result});
    });
});

router.get('/unconfirmed-properties', function (req, res) {
    const sql = `
        SELECT p.*, AVG(v.Rating) as avgRating
        FROM Property AS p
        LEFT JOIN Visit AS v ON p.ID = v.PropertyID
        WHERE p.ApprovedBy IS NULL
        GROUP BY p.ID`;
    db.query(sql, function(err, result) {
        if (err) {
            res.status(500).send({error: err});
            return;
        }
        res.render('admin/unconfirmedProperties', {properties: result});
    });

});


router.get('/approved-items', function (req, res) {
    let c = req.query.col ? req.query.col : 'Name';
    let m = req.query.pattern ? req.query.pattern : '';

    const sql = `
        SELECT Name, Type 
        FROM FarmItem
        WHERE IsApproved=TRUE AND ${c} LIKE '%${m}%'`;
    db.query(sql, function(err, result) {
        if (err) {
            res.status(500).send({error: err});
            return;
        }

        res.render('admin/approvedItems', {items: result});
    });
});

router.post('/add-item', function (req, res) {
    // TODO: HANDLE INSERTING DUPLICATE PRIMARY KEYS
    const sql = `
        INSERT INTO FarmItem
        VALUES('${req.body.name}', TRUE, '${req.body.type}')`;
    db.query(sql, function(err, result) {
        if (err) {
            res.status(500).send({error: err});
            return;
        }
        res.redirect('approved-items');
    });

});


router.get('/pending-items', function (req, res) {
    let c = req.query.col ? req.query.col : 'Name';
    let m = req.query.pattern ? req.query.pattern : '';

    const sql = `
        SELECT Name, Type 
        FROM FarmItem
        WHERE IsApproved=FALSE AND ${c} LIKE '%${m}%'`;

    db.query(sql, function(err, result) {
        if (err) {
            res.status(500).send({error: err});
            return;
        }
        res.render('admin/pendingItems', {items: result});
    });

});

router.get('/items/:name', function (req, res) {
    const sql = `
        SELECT Name, Type 
        FROM FarmItem
        WHERE Name='${req.params.name}'`;

    db.query(sql, function(err, result) {
        if (err) {
            res.status(500).send({error: err});
            return;
        }
        res.render('admin/item', {items: result});
    });
});

router.get('/approve-item/:item', function(req, res) {
    const item = req.params.item;
    const sql = `UPDATE FarmItem SET IsApproved=TRUE WHERE Name='${item}'`;
    db.query(sql, function(err, result) {
        if (err) {
            res.status(500).send({error: err});
            return;
        }
        console.log(result);
        res.render('admin/index', {user: req.session.name});
    });
});

router.get('/delete-item/:item', function(req, res) {
    const item = req.params.item;
    const sql = `DELETE FROM FarmItem WHERE Name='${item}'`;
    db.query(sql, function(err, result) {
        if (err) {
            res.status(500).send({error: err});
            return;
        }
        console.log(result);
        res.render('admin/index', {user: req.session.name});
    });
});





module.exports = router;
