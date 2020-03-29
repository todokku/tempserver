const express = require("express");
const app = express();
const cors = require("cors");
const fetch = require("node-fetch");
const port = 8080;
// Connection to the mongo client
const MongoClient = require("mongodb").MongoClient;
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
    } else {
      res.sendStatus(200);
    }
  });
});

app.put("/users/:id", async (req, res) => {
  const data = req.body;
  await users.replaceOne({ _id: req.params.id }, data)
  res.sendStatus(200);
});

app.get("/users/:userId/missions", (req, res) => {
  missions.find({ senderUserId: req.params.userId }).toArray((err, result) => {
    res.send(result);
  });
});

app.get("/users/:userId/tasks", (req, res) => {
  tasks.find({ receivingUserId: req.params.userId }).toArray((err, result) => {
    res.send(result);
  });
});

app.get("/missions", (req, res) => {
  missions.find({}).toArray((err, result) => {
    res.send(result);
  });
});


app.get("/desks/:deskId/missions", (req, res) => {
  missions.find({ senderDeskId: req.params.deskId }).toArray((err, result) => {
    res.send(result);
  });
});

app.get("/desks/:deskId/tasks", (req, res) => {
  tasks.find({ receivingDeskId: req.params.deskId }).toArray((err, result) => {
    res.send(result);
  });
});

app.get("/admin/:adminId/missions", (req, res) => {
  missions.find({ senderAdminId: req.params.adminId }).toArray((err, result) => {
    res.send(result);
  });
});

app.get("/admin/:adminId/tasks", (req, res) => {
  tasks.find({ receivingAdminId: req.params.adminId }).toArray((err, result) => {
    res.send(result);
  });
});

app.post("/missions", async (req, res, next) => {
  try {
    const mission = req.body;
    await missions.insertOne(mission);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

app.put("/missions/:id", async (req, res) => {
  const data = req.body;
  await missions.replaceOne({ _id: req.params.id }, data);
  res.sendStatus(200);
});

app.get("/missions/:id/tasks", (req, res) => {
  tasks.find({ "mission._id": req.params.id }).toArray((err, result) => {
    res.send(result);
  });
});

app.post("/tasks", async (req, res, next) => {
  try {
    const task = req.body;
    await tasks.insertOne(task);
    const missionId = task.mission._id;
    delete task.mission;
    await missions.updateOne({ _id: missionId, "tasks._id": task._id }, { $set: { "tasks.$": task } });
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

app.put("/tasks/:id", async (req, res, next) => {
  try {
    const task = req.body;
    await tasks.replaceOne({ _id: req.params.id }, task);
    const missionId = task.mission._id;
    delete task.mission;
    await missions.updateOne({ _id: missionId, "tasks._id": task._id }, { $set: { "tasks.$": task } });
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    next(err);
  }
});