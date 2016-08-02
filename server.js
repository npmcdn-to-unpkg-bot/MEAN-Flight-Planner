var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var CONTACTS_COLLECTION = "contacts";
var SENSORS_COLLECTION = "sensors";
var MISSION_COLLECTION = "mission";

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

// CONTACTS API ROUTES BELOW

// TODO: Replace with basic Simulator ROUTES

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

/*  "/fc/sensors"
 *    GET: returns the current sensor values
 *    POST: creates new sensor data set
 *    PUT: update the default sensor data
 *    DELETE: Remove sensor data set
 */

app.get("/fc/sensors", function(req, res) {
  db.collection(SENSORS_COLLECTION).find({}).toArray(function(err, docs) {
    if(err) {
      handleError(res, err.message, "Failed to get sensor data");
    }
    else {
      res.status(200).json(docs);
    }
  });
});

app.post("/fc/sensors", function(req, res) {
  var newSensorData = req.body;
  newSensorData.createDate = new Date();

  // TODO: Invalid data handler (handleError)

  // TODO: Change from insert to Update
  db.collection(SENSORS_COLLECTION).insertOne(newSensorData, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to add new sensor data");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});

app.put("/fc/sensors/", function(req, res) {
  var updateDoc = req.body;
  delete updateDoc._id;
  updateDoc.createDate = new Date();

  // Always id 579fa5fc22419f1a34bc19b0
  db.collection(SENSORS_COLLECTION).updateOne({_id: new ObjectID('579fa5fc22419f1a34bc19b0')}, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update sensors data");
    } else {
      res.status(204).end();
    }
  });
});

app.delete("/fc/sensors/:id", function(req, res) {
  db.collection(SENSORS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete Sensors data");
    } else {
      res.status(204).end();
    }
  });
});

app.get("/fc/sensors/:id", function(req, res) {
  db.collection(SENSORS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get sensors data");
    } else {
      res.status(200).json(doc);
    }
  });
});

/*  "/fc/mission"
 *    GET: returns the current mission data
 *    POST: creates new mission data set
 *    PUT: update the default mission data
 *    DELETE: Remove mission data set
 */

 app.get("/fc/mission", function(req, res) {
   db.collection(MISSION_COLLECTION).find({}).toArray(function(err, docs) {
     if(err) {
       handleError(res, err.message, "Failed to get mission data");
     }
     else {
       res.status(200).json(docs);
     }
   });
 });

 app.post("/fc/mission", function(req, res) {
   var newSensorData = req.body;
   newSensorData.createDate = new Date();

   // TODO: Invalid data handler (handleError)

   // TODO: Change from insert to Update
   db.collection(MISSION_COLLECTION).insertOne(newSensorData, function(err, doc) {
     if (err) {
       handleError(res, err.message, "Failed to add new mission data");
     } else {
       res.status(201).json(doc.ops[0]);
     }
   });
 });

 app.put("/fc/mission", function(req, res) {
   var updateDoc = req.body;
   delete updateDoc._id;
   updateDoc.createDate = new Date();

   // Always id 579fa5fc22419f1a34bc19b0
   db.collection(MISSION_COLLECTION).updateOne({_id: new ObjectID('579fa5fc22419f1a34bc19b0')}, updateDoc, function(err, doc) {
     if (err) {
       handleError(res, err.message, "Failed to update mission");
     } else {
       res.status(204).end();
     }
   });
 });

 app.delete("/fc/mission/:id", function(req, res) {
   db.collection(MISSION_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
     if (err) {
       handleError(res, err.message, "Failed to delete Mission info");
     } else {
       res.status(204).end();
     }
   });
 });

/* ---------  OLD API INFO  ----------  */

/*  "/contacts"
 *    GET: finds all contacts
 *    POST: creates a new contact
 */

app.get("/contacts", function(req, res) {
  db.collection(CONTACTS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get contacts.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post("/contacts", function(req, res) {
  var newContact = req.body;
  newContact.createDate = new Date();

  if (!(req.body.firstName || req.body.lastName)) {
    handleError(res, "Invalid user input", "Must provide a first or last name.", 400);
  }

  db.collection(CONTACTS_COLLECTION).insertOne(newContact, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to create new contact.");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});

/*  "/contacts/:id"
 *    GET: find contact by id
 *    PUT: update contact by id
 *    DELETE: deletes contact by id
 */

app.get("/contacts/:id", function(req, res) {
  db.collection(CONTACTS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get contact");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.put("/contacts/:id", function(req, res) {
  var updateDoc = req.body;
  delete updateDoc._id;

  db.collection(CONTACTS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update contact");
    } else {
      res.status(204).end();
    }
  });
});

app.delete("/contacts/:id", function(req, res) {
  db.collection(CONTACTS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete contact");
    } else {
      res.status(204).end();
    }
  });
});
