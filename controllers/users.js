const { Router } = require('express');
const { getTable } = require('../dal');
const { getStatusStats } = require('../utils/stats/deskStats')

const router = Router();
const usersCollection = getTable('users');
const missionsCollection = getTable('missions')
const tasksCollection = getTable('tasks');

router.get('/', (req, res) => {
    usersCollection.find({}).toArray((err, users) => {
        missionsCollection.find({}).toArray((err, missions) => {
            tasksCollection.find({}).toArray((err, tasks) => {
                const usersWithMissionsCount = users.map(user => {
                    const { 
                        waitingApproval,
                        done,
                        inProgress,
                        approved 
                    } = getStatusStats(missions, user, tasks);
                    const missionsCount = waitingApproval + done + inProgress + approved;
                    return {
                        ...user,
                        missionsCount
                    }
                });
                res.send(usersWithMissionsCount);
            });
        });
    });
});

router.post('/', (req, res, next) => {
    const doc = req.body;

    usersCollection.insertOne(doc, (err, result) => {
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

    await usersCollection.replaceOne({ _id: req.params.id }, data)
    res.sendStatus(200);
});

router.get('/:userId/missions', (req, res) => {
    missionsCollection.find({ senderUserId: req.params.userId }).toArray((err, result) => {
        res.send(result);
    });
});

router.get('/:userId/tasks', (req, res) => {
    tasks.find({ receivingUserId: req.params.userId }).toArray((err, result) => {
        res.send(result);
    });
});

module.exports = router;