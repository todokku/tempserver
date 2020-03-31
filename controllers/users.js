const {Router} = require('express');
const {getTable} = require('../dal');

const router = Router();
const users = getTable('users');

router.get('/', (req, res) => {
    users.find({}).toArray((err, result) => {
        res.send(result);
    });
});

router.post('/', (req, res, next) => {
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

router.put('/:id', async (req, res) => {
    const data = req.body;
    
    await users.replaceOne({ _id: req.params.id }, data)
    res.sendStatus(200);
});

router.get('/:userId/missions', (req, res) => {
    const missions = getTable('missions');
    
    missions.find({ senderUserId: req.params.userId }).toArray((err, result) => {
        res.send(result);
    });
});

router.get('/:userId/tasks', (req, res) => {
    const tasks = getTable('tasks');
    
    tasks.find({ receivingUserId: req.params.userId }).toArray((err, result) => {
        res.send(result);
    });
});

module.exports = router;