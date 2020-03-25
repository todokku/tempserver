const express = require("express");
const app = express();
const cors = require("cors");
const fetch = require("node-fetch");
const port = 8080;
// Connection to the mongo client
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
require("dotenv").config();

app.use(cors());

let mongoURL;

if (process.env.IS_PRODUCTION === "true") {
  mongoURL =
    "mongodb+srv://mike:hellman@dashboard-vcavt.azure.mongodb.net/test?retryWrites=true&w=majority";
} else {
  mongoURL =
    "mongodb+srv://admin:admin@cluster0-3ftjv.mongodb.net/test?retryWrites=true&w=majority";
}

const CONNECTION_URL = mongoURL;
const DATABASE_NAME = "dashboard-new";
let database;
let users, missions, tasks;

app.listen(process.env.PORT || port, () => {
  MongoClient.connect(
    CONNECTION_URL,
    { useNewUrlParser: true, useUnifiedTopology: true },
    (error, client) => {
      if (error) {
        throw error;
      }
      database = client.db(DATABASE_NAME);
      collection = database.collection("masal");
      users = database.collection("users");
      missions = database.collection("missions");
      tasks = database.collection("tasks");
      console.log("Connected to `" + DATABASE_NAME + "`!");
    }
  );
});

app.get("/", async (req, res) => {
  res.send("tester");
});

app.get("/getCorona", async (req, res) => {
  const cData = await fetch("https://israelcoronamap.co.il/data/data-he.json");
  const cResponse = await cData.json();
  res.send(cResponse);
});

app.get("/users", async (req, res) => {
  users.find({}).toArray((err, result) => {
    res.send(result);
  });
});

app.post("/users", async (req, res) => {
  const doc = req.body;
  collectionUsers.insertOne(doc, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      collectionUsers.find({}).toArray((err, result) => {
        res.send(result);
      });
    }
  });
});

app.put("/users/:id", async (req, res) => {
  const data = req.body;
  collectionUsers
    .replaceOne({ _id: ObjectId(req.params.id) }, data)
    .then(result => {
      collectionUsers.find({}).toArray((err, result) => {
        res.send(result);
      });
    });
});

app.get("/tasks", async (req, res) => {
  tasks.find({}).toArray((err, result) => {
    res.send(result);
  });
});

app.post("/tasks", async (req, res) => {
  const doc = req.body;
  collection.insertOne(doc, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      collection.find({}).toArray((err, result) => {
        res.send(result);
      });
    }
  });
});

app.put("/tasks/:id", async (req, res) => {
  const data = req.body;
  collection.replaceOne({ _id: ObjectId(req.params.id) }, data).then(result => {
    collection.find({}).toArray((err, result) => {
      res.send(result);
    });
  });
});

app.delete("/tasks/:id", async (req, res) => {
  const id = req.params.id;
  collection.deleteOne({ _id: ObjectId(id) }).then(deleted => {
    collection.find({}).toArray((err, result) => {
      res.send(result);
    });
  });
});

/* TEST - ONLY UNCOMMENT IF AND ONLY IF THERE IS A CRITICAL DB/SERVER CONNECTION ERROR - UNCOMMENT ABOVE IN CLIENT CONNECT
const insertDocumentTester = function(db, callback) {
  // Get the documents collection
  const collection = db.collection("masal");
  // Insert some documents
  collection.insertMany([{ a: 1 }, { a: 2 }, { a: 3 }], function(err, result) {
    assert.equal(err, null);
    assert.equal(3, result.result.n);
    assert.equal(3, result.ops.length);
    console.log("Inserted 3 documents into the collection");
    callback(result);
  });
};*/
