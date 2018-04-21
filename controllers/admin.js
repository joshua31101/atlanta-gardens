const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/', function(req, res) {
  res.render('visitor/index');
});

router.get('/view-visitors', function(req, res) {
  // TODO: Need to get number of logged visits instead of password
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
        WHERE User.UserType="VISITOR" AND User.Username = '${visitorUsername}'`;
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

});

// router.get('/')


module.exports = router;
