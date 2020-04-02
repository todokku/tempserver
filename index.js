require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const fetch = require('node-fetch');
const Config = require('./config');
const DAL = require('./dal');
const bodyParser = require('body-parser');

const PORT = 8080;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(require("morgan")("tiny"))
require('dotenv').config();

app.use(cors());

app.listen(process.env.PORT || PORT, async () => {
  await DAL.init(Config.mongoUrl, Config.dbName);

  const Controllers = require('./controllers'); //must be after DB initialization
  Controllers.forEach(({controller, baseRoute}) => {
    app.use(`/${baseRoute}`, controller)
  })
});

app.get('/', async (req, res) => {
  res.send('tester');
});

app.get('/getCorona', async (req, res) => {
  const cData = await fetch('https://israelcoronamap.co.il/data/data-he.json');
  const cResponse = await cData.json();
  res.send(cResponse);
});