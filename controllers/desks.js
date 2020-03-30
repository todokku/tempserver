const {Router} = require('express');
const {getTable} = require('../dal');

const router = Router();

router.get('/:deskId/missions', (req, res) => {
    const missions = getTable('missions');

    missions.find({ senderDeskId: req.params.deskId }).toArray((err, result) => {
      res.send(result);
    });
});
  
router.get('/:deskId/tasks', (req, res) => {
    const tasks = getTable('tasks');

    tasks.find({ receivingDeskId: req.params.deskId }).toArray((err, result) => {
        res.send(result);
    });
});

module.exports = router;