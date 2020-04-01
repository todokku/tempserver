const _ = require('lodash');
const { getTable } = require('../../dal');
const { MissionsByStatus } = require('./statuses');

const missionsCollection = getTable('missions');
const usersCollection = getTable('users');
const tasksCollection = getTable('tasks');

function getStatusStats(missions, user, tasks) {
    const { missions: waitingApproval } = MissionsByStatus.approvalPending(missions, user);
    const { missions: rejected } = MissionsByStatus.rejected(missions, user);
    const { missions: done } = MissionsByStatus.finishedMissions(missions, user);
    const { missions: inProgress } = MissionsByStatus.inExecution(missions, user, tasks);
    const { missions: approved } = MissionsByStatus.associationPending(missions, user, tasks);
    return {
        waitingApproval: waitingApproval.length,
        rejected: rejected.length,
        done: done.length,
        inProgress: inProgress.length,
        approved: approved.length
    }
}

function getDeskUser(deskId) {
    return new Promise((resolve, reject) => {
        usersCollection.find({ _id: deskId }).toArray((err, users) => {
            // remove rosh desk from name
            const user = users[0];
            user.name = user.name.replace("ראש דסק", "").trim()
            resolve(user);
        });
    });
}

function getTasks() {
    return new Promise((resolve, reject) => {
        tasksCollection.find({}).toArray((err, result) => {
            resolve(result);
        });
    });
}

async function getDeskStats() {
    return new Promise((resolve, reject) => {
        missionsCollection.find({}).toArray(async (err, missions) => {
            const missionsByDesk = _.groupBy(missions, mission => {
                return mission.senderDeskId;
            });

            const tasks = await getTasks();
            const deskStats = {};
            const deskIds = Object.keys(missionsByDesk);
            for (let index = 0; index < deskIds.length; index++) {
                const deskId = deskIds[index];
                const deskUser = await getDeskUser(deskId);
                deskStats[deskUser.name] = getStatusStats(missions, deskUser, tasks);
            }

            resolve(deskStats);
        });
    });
}

module.exports = {
    getDeskStats
}