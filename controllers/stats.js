const { Router } = require('express');
const { getLastWeekStats } = require('../utils/stats/missionStats');
const { getDeskStats } = require('../utils/stats/deskStats');
const { getTaskStats } = require('../utils/stats/taskStats');

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