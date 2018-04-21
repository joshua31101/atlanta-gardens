const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/', function(req, res) {
  res.render('visitor/index');
});

router.get('/view-visitors', function(req, res) {
    const sql = `
        SELECT Username, Email, (SELECT COUNT(*) FROM Visit WHERE Visit.Username=User.Username) as visits 
        FROM User
        WHERE UserType="VISITOR"`;
    db.query(sql, function(err, result) {
      if (err) {
        res.status(500).send({error: err});
        return;
      }
      console.log(result);
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
    const sql = `
        SELECT Username, Email, (SELECT COUNT(*) FROM Property WHERE Property.Owner=User.Username) as properties
        FROM User
        WHERE UserType="OWNER"`;
    db.query(sql, function(err, result) {
        if (err) {
            res.status(500).send({error: err});
            return;
        }
        console.log(result);
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
    const sql = `
        SELECT *
        FROM Property
        WHERE ApprovedBy IS NOT NULL`;
    db.query(sql, function(err, result) {
        if (err) {
            res.status(500).send({error: err});
            return;
        }
        console.log(result);
        res.render('admin/confirmedProperties', {properties: result});
    });
});

router.get('/unconfirmed-properties', function (req, res) {
    const sql = `
        SELECT *
        FROM Property
        WHERE ApprovedBy IS NULL`;
    db.query(sql, function(err, result) {
        if (err) {
            res.status(500).send({error: err});
            return;
        }
        console.log(result);
        res.render('admin/unconfirmedProperties', {properties: result});
    });

});


router.get('/approved-items', function (req, res) {
    const sql = `
        SELECT Name, Type 
        FROM FarmItem
        WHERE IsApproved=TRUE`;
    db.query(sql, function(err, result) {
        if (err) {
            res.status(500).send({error: err});
            return;
        }
        console.log(result);
        res.render('admin/approvedItems', {items: result});
    });

});

router.get('/pending-items', function (req, res) {
    const sql = `
        SELECT Name, Type 
        FROM FarmItem
        WHERE IsApproved=FALSE`;
    db.query(sql, function(err, result) {
        if (err) {
            res.status(500).send({error: err});
            return;
        }
        console.log(result);
        res.render('admin/pendingItems', {items: result});
    });

});




// router.get('/')


module.exports = router;
