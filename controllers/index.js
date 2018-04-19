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
            var propertiesList = [];
            const sql = `SELECT * FROM Property WHERE ApprovedBy IS NOT NULL`;
            db.query(sql, function(err, result) {
                if (err) {
                    res.status(500).send({error: err});
                    return;
                }
                for (var i = 0; i < result.length; i++) {

    	  			// Create an object to save current row's data
    		  		var properties = {
    		  			'name':rows[i].Name,
    		  		}
    		  		// Add object into array
    		  		propertiesList.push(properties);
    	  	    }
                res.render('visit/index', {"propertiesList": propertiesList});
                console.log(result);
            });
        } else if (req.session.user_type === 'OWNER') {
          // Redirect to owner page
          res.render('owner/index');
        }
    } else {
    res.redirect('login');
    }
});


module.exports = router;
