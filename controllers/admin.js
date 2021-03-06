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

router.get('/visitors/sort', function(req, res) {
  const sortByCol = req.query.sortBy;
  const sortOrder = req.query.sortOrder;
  let sql = ``;
  if (sortByCol === 'Visits') {
    sql = `
        SELECT User_Visit.Username, User_Visit.Email, User_Visit.visits FROM
        (SELECT Username, Email, (SELECT COUNT(*) FROM Visit WHERE Visit.Username=User.Username) AS visits
        FROM User
        WHERE UserType='VISITOR') AS User_Visit ORDER BY ${sortByCol} ${sortOrder}`;
  } else {
    sql = `
      SELECT Username, Email, (SELECT COUNT(*) FROM Visit WHERE Visit.Username=User.Username) as visits
      FROM User
      WHERE UserType='VISITOR' ORDER BY ${sortByCol} ${sortOrder}`;
  }
  db.query(sql, function(err, result) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.status(200).send({ visitors: result });
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

router.get('/owners/sort', function(req, res) {
  const sortByCol = req.query.sortBy;
  const sortOrder = req.query.sortOrder;
  let sql = `
      SELECT Username, Email, (SELECT COUNT(*) FROM Property WHERE Property.Owner=User.Username) AS properties
      FROM User
      WHERE UserType='OWNER' ORDER BY ${sortByCol} ${sortOrder}`;

  if (sortByCol === 'Properties') {
    sql = `
        SELECT User_Prop.Username AS Username, User_Prop.Email AS Email, User_Prop.properties AS properties FROM
        (SELECT Username, Email, (SELECT COUNT(*) FROM Property WHERE Property.Owner=User.Username) AS properties
        FROM User
        WHERE UserType='OWNER') AS User_Prop ORDER BY ${sortByCol} ${sortOrder}`;
  }
  db.query(sql, function(err, result) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.status(200).send({ owners: result });
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

router.get('/confirmed-properties/sort', function (req, res) {
  const sortByCol = req.query.sortBy;
  const sortOrder = req.query.sortOrder;
  const sql = `
    SELECT p.*, AVG(v.Rating) as avgRating
    FROM Property AS p
    LEFT JOIN Visit AS v ON p.ID = v.PropertyID
    WHERE p.ApprovedBy IS NOT NULL
    GROUP BY p.ID ORDER BY ${sortByCol} ${sortOrder}`;
  db.query(sql, function(err, result) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.status(200).send({ properties: result });
  });
});

router.get('/unconfirmed-properties', function (req, res) {
    let c = req.query.col ? req.query.col : 'Name';
    let m = req.query.pattern ? req.query.pattern : '';

    let sql = `
        SELECT p.*, AVG(v.Rating) as avgRating
        FROM Property AS p
        LEFT JOIN Visit AS v ON p.ID = v.PropertyID
        WHERE p.ApprovedBy IS NULL AND p.${c} LIKE '%${m}%'
        GROUP BY p.ID`;

    if (c === 'Zip' || c === 'Size' || c === 'ID') {
        sql = `
        SELECT * FROM
        (SELECT p.*, AVG(v.Rating) as avgRating
        FROM Property AS p
        LEFT JOIN Visit AS v ON p.ID = v.PropertyID
        WHERE p.ApprovedBy IS NULL
        GROUP BY p.ID) AS Prop
        WHERE Prop.${c}=${m}`;
    }


    db.query(sql, function(err, result) {
        if (err) {
            res.status(500).send({error: err});
            return;
        }
        res.render('admin/unconfirmedProperties', {properties: result});
    });

});


router.get('/unconfirmed-properties/sort', function (req, res) {
  const sortByCol = req.query.sortBy;
  const sortOrder = req.query.sortOrder;
  const sql = `
      SELECT p.*, AVG(v.Rating) as avgRating
      FROM Property AS p
      LEFT JOIN Visit AS v ON p.ID = v.PropertyID
      WHERE p.ApprovedBy IS NULL
      GROUP BY p.ID ORDER BY ${sortByCol} ${sortOrder}`;
  db.query(sql, function(err, result) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.status(200).send({ properties: result });
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

router.get('/approved-items/sort', function (req, res) {
  const sortByCol = req.query.sortBy;
  const sortOrder = req.query.sortOrder;
  const sql = `
    SELECT Name, Type
    FROM FarmItem
    WHERE IsApproved=TRUE ORDER BY ${sortByCol} ${sortOrder}`;
  db.query(sql, function(err, result) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.status(200).send({ items: result });
  });
});

router.get('/prop/:id', function(req, res) {
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
    ) AS Has_FarmItem ON Has_FarmItem.PropertyID = p.ID
    WHERE p.ID = ${propertyId};
    `;
    db.query(sql, function(err, result) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect(`admin/index`);
        }
        console.log(result);
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
                return res.redirect(`admin/index`);
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

            res.render('admin/property', {
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

    if (animals) {
      if (typeof animals === 'string') {
        animals = [animals];
      }
    } else {
      animals = [];
    }
    if (crops) {
      if (typeof crops === 'string') {
        crops = [crops];
      }
    } else {
      crops = [];
    }

    if (propertyType === 'FARM') {
        if (!animals || !crops || (animals && !animals.length) || (crops && !crops.length)) {
            req.flash('error', 'Farm must have both an animal and a crop.');
            return res.redirect(`/admin/prop/${propertyId}`);
        }
    } else {
        if (!crops || (crops && !crops.length)) {
            req.flash('error', 'Garden or orchard must have a crop.');
            return res.redirect(`/admin/prop/${propertyId}`);
        }
    }

    let sql = `
    UPDATE Property
    SET
      ID = ${propertyId},
      Name = '${propertyName}',
      Size = ${acres},
      ApprovedBy = '${req.session.username}',
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
            return res.redirect(`/admin/prop/${propertyId}`);
        }

        let removedItems = [];
        let newItems = [];
        let items = {};
        sql = `SELECT * FROM Has WHERE PropertyID = ${propertyId}`;
        db.query(sql, function(er, hasResult) {
            if (er) {
                req.flash('error', er);
                return res.redirect(`/admin/prop/${propertyId}`);
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
                        return res.redirect(`/admin/prop/${propertyId}`);
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
                        return res.redirect(`/admin/prop/${propertyId}`);
                    }
                });
            }

            // remove all visits
            let sqlVisit = `
                DELETE FROM Visit
                WHERE PropertyID=${propertyId}
            `;
            db.query(sqlVisit, function (err, result) {
                req.flash('success', 'Successfully updated/confirmed!');
                return res.redirect(`/admin/confirmed-properties`);
            });
        });
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

router.get('/pending-items/sort', function (req, res) {
  const sortByCol = req.query.sortBy;
  const sortOrder = req.query.sortOrder;
  const sql = `
    SELECT Name, Type
    FROM FarmItem
    WHERE IsApproved=FALSE ORDER BY ${sortByCol} ${sortOrder}`;
  db.query(sql, function(err, result) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.status(200).send({ items: result });
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
    let typeSql = `SELECT Type FROM FarmItem WHERE Name='${item}'`;
    db.query(typeSql, function(err, result) {
        if (err) {
            req.flash('error', err);
            res.redirect(`/admin/items/${item}`);
        }
        let type = 'crops';
        if (result[0].Type.toLowerCase() === 'animal') {
            type = 'animals';
        }
        let sql = `
        SELECT * FROM
        (SELECT id, SUM(case when Type = 'Animal' Then 1 Else 0 end) as animals, sum(case when Type != 'Animal' then 1 else 0 end) as crops from (SELECT id, ItemName, Type FROM
        (SELECT PropertyID as id from Has Where ItemName = '${item}') q1 Inner Join (SELECT PropertyID, ItemName,
        Type From Has, FarmItem Where Has.ItemName = FarmItem.Name) q2
        ON q1.id= q2.PropertyID Order By q1.id) q3 group by id) as Q
        WHERE Q.${type} = 1;
        `;
        db.query(sql, function(err, result1) {
            if (err) {
                req.flash('error', err);
                res.redirect(`/admin/items/${item}`);
            }
            if (result1.length === 0) {
                const sql = `DELETE FROM FarmItem WHERE Name='${item}'`;
                db.query(sql, function(err, result) {
                    if (err) {
                        req.flash('error', err);
                        res.redirect(`/admin/items/${item}`);
                    }
                    console.log(result);
                    req.flash('success', 'Successfully deleted!');
                    res.render('admin/index', {user: req.session.name});
                });
            } else {
                req.flash('error', 'Property 1 item thing');
                res.redirect(`/admin/items/${item}`);
            }
        });
    });
});

router.get('/delete-property/:id', function(req, res) {
    const id = req.params.id;
    const sql = `DELETE FROM Property WHERE ID='${id}'`;
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
