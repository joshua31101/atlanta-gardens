const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/visitor-register', function(req, res) {
  res.render('visitor/register');
});

router.post('/visitor-register', function(req, res) {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const sql = `INSERT INTO User (Username, Email, Password, UserType) VALUES ('${username}', '${email}', MD5('${password}'), "VISITOR")`;
    db.query(sql, function(err, result) {
    if (err) {
        res.status(500).send({error: err});
        return;
    }
    res.redirect('/');
    });
});

router.get('/owner-register', function(req, res) {
  const farmItemQuery = `SELECT * FROM FarmItem WHERE IsApproved=1 ORDER BY Type`;
  db.query(farmItemQuery, function(err, result) {
    if (err) {
      req.flash('error', err.message);
      res.redirect('/owner-register');
      return;
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

    res.render('owner/register', {
      animals: animals,
      orchardCrops: orchardCrops,
      gardenCrops: gardenCrops
    });
  })
});

router.post('/owner-register', function(req, res) {
  const {
    username,
    email,
    password,
    confirmPassword,
    propertyName,
    isPublic,
    isCommercial,
    streetAddress,
    city,
    zip,
    acres,
    propertyType,
    crop,
    animal,
  } = req.body;

  if (!(/[^\s@]+@[^\s@]+\.[^\s@]+/.test(email))) {
    req.flash('error', 'Email is not valid.');
    res.redirect('/owner-register');
    return;
  }

  if (password !== confirmPassword) {
    req.flash('error', 'Password and confirm password do not match.');
    res.redirect('/owner-register');
    return;
  }

  if (propertyType === 'Farm') {
    if (!animal || !crop) {
      req.flash('error', 'Farm must have an animal and a crop.');
      res.redirect('/owner-register');
      return;
    }
  } else {
    if (!crop) {
      req.flash('error', 'Garden or orchard must have a crop.');
      res.redirect('/owner-register');
      return;
    }
  }

  let sql = `INSERT INTO User VALUES('${username}', '${email}', MD5('${password}'), 'OWNER');`;
  db.query(sql, function(err, result) {
    if (err) {
      req.flash('error', err.message);
      res.redirect('/owner-register');
      return;
    }

    sql = `
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
        return res.redirect('/owner-register');
      }
      const newPropertyId = result.insertId;
      if (propertyType === 'Farm') {
        sql = `INSERT INTO Has VALUES(${newPropertyId},	'${animal}');`
        db.query(sql, function(er, r) {
          if (err) {
            req.flash('error', er);
            return res.redirect('/owner-register');
          }
        });
      }
      sql = `INSERT INTO Has VALUES(${newPropertyId},	'${crop}');`
      db.query(sql, function(er, r) {
        if (err) {
          req.flash('error', err);
          return res.redirect('/owner-register');
        }
      });

      req.session.user_type = 'OWNER';
      req.session.username = username;
      return res.redirect('/');
    });
  });
});

router.get('/visitor-register', function(req, res) {
  res.render('visitor/register');
});

router.post('/visitor-register', function(req, res) {
  res.render('visitor/register');
});


module.exports = router;
