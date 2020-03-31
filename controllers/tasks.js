const {Router} = require('express');
const {getTable} = require('../dal');

const router = Router();
const tasks = getTable('tasks');

router.post('/', async (req, res, next) => {
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
  
router.put('/:id', async (req, res, next) => {
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

module.exports = router;