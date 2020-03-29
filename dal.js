const {MongoClient} = require('mongodb');

let database;
const tables = {};

const init = async (url, name) => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (error, client) => {
        if (error) {
          reject(error);
        }

        database = client.db(name);
        console.log("Connected to `" + name + "`!");
        resolve();
      });
    });
}

const getTable = (tableName) => {
    console.log(tableName);
    if(tables[tableName] === undefined){
        tables[tableName] = database.collection(tableName);
    }
    
    return tables[tableName];
}

module.exports = {
    getTable,
    init
};