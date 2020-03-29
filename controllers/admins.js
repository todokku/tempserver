const {Router} = require('express');
const {getTable} = require('../dal');

const router = Router();

router.get('/:adminId/missions', (req, res) => {
    const missions = getTable('missions');

    missions.find({ senderAdminId: req.params.adminId }).toArray((err, result) => {
      res.send(result);
    });
});

router.get('/:adminId/tasks', (req, res) => {
    const tasks = getTable('tasks');

    tasks.find({ receivingAdminId: req.params.adminId }).toArray((err, result) => {
        res.send(result);
    });
});

module.exports = router;