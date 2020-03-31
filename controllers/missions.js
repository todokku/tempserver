const {Router} = require('express');
const {getTable} = require('../dal');

const router = Router();
const missions = getTable('missions');

router.get('/', (req, res) => {
    missions.find({}).toArray((err, result) => {
      res.send(result);
    });
});

router.post('/', async (req, res, next) => {
    try {
        const mission = req.body;
        await missions.insertOne(mission);
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.put('/:id', async (req, res) => {
    const data = req.body;
    await missions.replaceOne({ _id: req.params.id }, data);
    res.sendStatus(200);
});

router.get('/:id/tasks', (req, res) => {
    tasks.find({'mission._id': req.params.id }).toArray((err, result) => {
        res.send(result);
    });
});
  
module.exports = router;
  