const {Router} = require('express');
const {getTable} = require('../dal');

const router = Router();
const userOrders = getTable('user-orders');

router.get('/', (req, res) => {
    userOrders.find({}).toArray((err, result) => {
        res.send(result);
    });
});

router.post('/', (req, res, next) => {
    const doc = req.body;
    
    userOrders.insertOne(doc, (err, result) => {
        if (err) {
            console.log(err);
            next(err);
        } else {
            res.sendStatus(200);
        }
    });
});

router.put('/:id', async (req, res) => {
    const data = req.body;
    
    await userOrders.replaceOne({ _id: req.params.id }, data)
    res.sendStatus(200);
});

module.exports = router;