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

let CONNECTION_URL;
let DATABASE_NAME;

if (process.env.IS_PRODUCTION === "true") {
  CONNECTION_URL =
    "mongodb+srv://mike:hellman@dashboard-vcavt.azure.mongodb.net/test?retryWrites=true&w=majority";
  DATABASE_NAME = "dashboard";
} else {
  CONNECTION_URL =
    "mongodb+srv://admin:admin@cluster0-3ftjv.mongodb.net/test?retryWrites=true&w=majority";
  DATABASE_NAME = "dashboard-new";
}


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

app.get("/users", (req, res) => {
  users.find({}).toArray((err, result) => {
    res.send(result);
  });
});

app.post("/users", (req, res, next) => {
  const doc = req.body;
  users.insertOne(doc, (err, result) => {
    if (err) {
      console.log(err);
      next(err);
    }
  });
});

app.put("/users/:id", async (req, res) => {
  const data = req.body;
  await users.replaceOne({ _id: ObjectId(req.params.id) }, data)
  res.sendStatus(200);
});

app.get("/users/:userId/tasks", (req, res) => {
  tasks.find({ receivingUser: req.params.userId }).toArray((err, result) => {
    res.send(result);
  });
});

app.get("/users/:userId/missions", (req, res) => {
  missions.find({ senderUser: req.params.userId }).toArray((err, result) => {
    res.send(result);
  });
});

app.get("/missions", (req, res) => {
  missions.find({}).toArray((err, result) => {
    res.send(result);
  });
});


app.get("/desks/:deskId/missions", (req, res) => {
  missions.find({ senderDesk: req.params.deskId }).toArray((err, result) => {
    res.send(result);
  });
});

app.get("/desks/:deskId/tasks", (req, res) => {
  missions.find({ receivingDesk: req.params.deskId }).toArray((err, result) => {
    res.send(result);
  });
});

app.post("/missions", (req, res, next) => {
  const doc = req.body;
  missions.insertOne(doc, (err, result) => {
    if (err) {
      console.log(err);
      next(err);
    }
  });
});

app.put("/missions/:id", async (req, res) => {
  const data = req.body;
  await missions.replaceOne({ _id: ObjectId(req.params.id) }, data);
  res.sendStatus(200);
});

app.delete("/missions/:id", async (req, res) => {
  const id = req.params.id;
  await missions.deleteOne({ _id: ObjectId(id) });
  res.sendStatus(200);
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
