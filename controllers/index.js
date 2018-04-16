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
router.use('/visitor', authorize, require('./visitor'));
router.use('/owner', authorize, require('./owner'));
router.use('/admin', authorize, require('./admin'));

// Landing page
router.get('/', function(req, res) {
  // If logged in, then render a page based on user type
  if (req.session.user_type) {
    if (req.session.user_type === 'ADMIN') {
      // Redirect to admin page
      res.render('admin/index');
    } else if (req.session.user_type === 'VISITOR') {
      // Redirect to visitor page
      res.render('visitor/index');
    } else if (req.session.user_type === 'OWNER') {
      // Redirect to owner page
      res.render('owner/index');
    }
  } else {
    res.redirect('login');
  }
});


module.exports = router;
