const { Router } = require('express');
const { getLastWeekStats } = require('./missionStats');
const { getDeskStats } = require('./deskStats');
const { getTaskStats } = require('./taskStats');

const router = Router();

router.get('/dashboards', async (req, res) => {
    const weekHistogram = await getLastWeekStats();
    const deskStats = await getDeskStats();
    const taskStats = await getTaskStats();

    res.send({
        weekHistogram,
        deskStats,
        taskStats
    });
});

module.exports = router;