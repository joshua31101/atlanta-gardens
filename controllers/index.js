const express = require('express');
const router = express.Router();
const db = require('./db');

const authorize = function(req, res, next) {
  if (!req.session.user_type) {
    res.status(403).send('Forbidden access');
  } else {
    next();
  }
};

// Contains login/logout, and visitor/owner registrations
router.use(require('./authenticate'));
router.use(require('./register'));
router.use('/visitor', authorize, require('./visitor'));
router.use('/owner', authorize, require('./owner'));
router.use('/admin', authorize, require('./admin'));
router.use('/properties', authorize, require('./properties'));

// Landing page
router.get('/', function(req, res) {
    const username = req.session.username;
  // If logged in, then render a page based on user type
    if (req.session.user_type) {
        if (req.session.user_type === 'ADMIN') {
          // Redirect to admin page
          res.render('admin/index');
        } else if (req.session.user_type === 'VISITOR') {
            const sql = `SELECT * FROM Property WHERE IsPublic IS True AND ApprovedBy IS NOT NULL`;
            db.query(sql, function(err, result) {
              if (err) {
                res.status(500).send({error: err});
                return;
              }
              res.render('visitor/index', {propertiesList: result, user: username});
          });
        } else if (req.session.user_type === 'OWNER') {
          const sql = `SELECT * FROM Property WHERE Owner='${username}'`;
          db.query(sql, function(err, result) {
            if (err) {
              req.flash('error', err.message);
              return res.redirect('/');
            }
            res.render('owner/index', {
              username: username,
              ownerProperties: result
            });
          });
        }
    } else {
    res.redirect('login');
    }
});


module.exports = router;
