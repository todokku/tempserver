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
        usersCollection.find({}).toArray(async (err, users) => {
            missionsCollection.find({}).toArray(async (err, missions) => {
                const desks = users.filter(({ type }) => type === "desk");
                const deskIdToMissions = missions.reduce((final, mission) => {
                    final[mission.senderDeskId] = (final[mission.senderDeskId] || []).concat(mission);
                    return final;
                }, {});

                const getMissionStatus = mission => {
                    if (mission.status === "deskApproved" || mission.status === "new") {
                        return "waitingApproval";
                    }
                    if (mission.status === "deskRejected" || mission.status === "adminRejected") {
                        return "rejected";
                    }
                    if (mission.tasks.every(task => task.status === "done")) {
                        return "done";
                    }
                    return "inProgress";
                }

                const statuses = ["waitingApproval", "rejected", "inProgress", "done"];

                const deskStats = desks.reduce((final, desk) => {
                    const deskMissions = deskIdToMissions[desk._id];
                    final[desk.name.replace("ראש דסק", "").trim()] = statuses.reduce((final, status) => {
                        final[status] = deskMissions.filter(mission => getMissionStatus(mission) === status).length;
                        return final;
                    }, {});
                    return final;
                }, {});

                resolve({ stats: deskStats, missionsCount: missions.length });
            });
        })
    });
}

module.exports = {
    getDeskStats,
    getStatusStats
}