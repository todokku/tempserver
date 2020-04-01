const dal = require('./dal');
const fetch = require('node-fetch');
const { ObjectId } = require('mongodb');

(async () => {
    const masalsUrl = "https://masal.herokuapp.com/getAllTasks";
    const usersUrl = "https://masal.herokuapp.com/getAllUsers";
    const mongoUrl = 'mongodb+srv://admin:admin@cluster0-3ftjv.mongodb.net/test?retryWrites=true&w=majority';
    const dbName = 'dashboard';
    const usersCollectionName = "users";
    const masalsCollectionName = "masal";

    await dal.init(mongoUrl, dbName);
    const usersCollection = dal.getTable(usersCollectionName);
    const masalsCollection = dal.getTable(masalsCollectionName);

    const users = await fetch(usersUrl).then(result => result.json());
    let masals = await fetch(masalsUrl).then(result => result.json());

    await usersCollection.insertMany(users.map(u => { u._id = new ObjectId(u._id); return u; }));
    await masalsCollection.insertMany(masals.map(u => { u._id = new ObjectId(u._id); return u; }));
})().then(() => console.log("done")).catch(e => console.error(e));
