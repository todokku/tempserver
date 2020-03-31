const express = require('express');
const app = express();
const cors = require('cors');
const fetch = require('node-fetch');
const Config = require('./config');
const DAL = require('./dal');
const bodyParser = require('body-parser');
const azureStore = require('azure-storage');

const AZURE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=masal;AccountKey=mtM0kYLYCnJBd5m0HiUsZs3R0W9RCFWNqPHfiYSm0TKFa5EHXnmv4a4KlzxyrGRT44i50Z8tBnPVjE/rrY7hew==;EndpointSuffix=core.windows.net"
const PORT = 8080;
var blobService;

try {
  blobService = azureStore.createBlobService(AZURE_CONNECTION_STRING)
}
catch (exception) {
  console.log("could not access azure store, requests for token will be failed")
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
require('dotenv').config();

app.use(cors());

app.listen(process.env.PORT || PORT, async () => {
  await DAL.init(Config.mongoUrl, Config.dbName);

  const Controllers = require('./controllers'); //must be after DB initialization
  Controllers.forEach(({ controller, baseRoute }) => {
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

app.get('/token/:container', (async (req, res, next) => {
  try {
    const container = req.params.container;
    const permissions = azureStore.BlobUtilities.SharedAccessPermissions.READ +
      azureStore.BlobUtilities.SharedAccessPermissions.WRITE +
      azureStore.BlobUtilities.SharedAccessPermissions.LIST;

    var sharedAccessPolicy = {
      AccessPolicy: {
        Permissions: permissions,
      }
    };

    const token = blobService.generateSharedAccessSignature(container, null, sharedAccessPolicy)
    res.send(token);
  }
  catch (err) {
    console.log(err);
    next(err);
  }
}))