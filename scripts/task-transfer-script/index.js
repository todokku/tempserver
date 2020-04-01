const { ObjectID } = require('mongodb');
const dal = require('./dal');
const fetch = require('node-fetch');
let adminId;

(async () => {
    const masalsUrl = "https://masaldev.herokuapp.com/getAllTasks";
    const usersUrl = "https://masaldev.herokuapp.com/getAllUsers";
    const mongoUrl = 'mongodb+srv://admin:admin@cluster0-3ftjv.mongodb.net/test?retryWrites=true&w=majority';
    const dbName = 'dashboard-new';
    const usersCollectionName = "users-amitai";
    const userOrdersCollectionName = "user-orders"
    const missionsCollectionName = "missions-amitai";
    const tasksCollectionName = "tasks-amitai";

    await dal.init(mongoUrl, dbName);
    const usersCollection = dal.getTable(usersCollectionName);
    const userOrdersCollection = dal.getTable(userOrdersCollectionName);
    const missionsCollection = dal.getTable(missionsCollectionName);
    const tasksCollection = dal.getTable(tasksCollectionName);

    const oldUsers = await fetch(usersUrl).then(result => result.json());
    const existingUsers = convertUsers(oldUsers);
    const userOrders = getUserOrders(existingUsers);

    let masals = await fetch(masalsUrl).then(result => result.json());
    console.log("before uniq: ", masals.length);
    masals = masals.filter(m => m.missionRequests.length > 0); //Get rid of masals without tasks. 
    console.log("actually before uniq: ", masals.length);
    masals = uniqMasals(masals); //Get rid of duplicates. They exist. see task id 10_5obajdjz5
    console.log("after uniq: ", masals.length);

    const { missions, tasks, users } = convertMasals(masals, existingUsers);

    await usersCollection.insertMany(users);
    await userOrdersCollection.insertMany(userOrders);
    await missionsCollection.insertMany(missions);
    await tasksCollection.insertMany(tasks);
})().then(() => console.log("done")).catch(e => console.error(e));

const uniqMasals = masals => {
    const uniques = [];
    const duplicates = {};

    masals.forEach(masal => {
        if (masals.filter(innerMasal => masal.missionRequests[0].id === innerMasal.missionRequests[0].id).length > 1) {
            duplicates[masal.missionRequests[0].id] = (duplicates[masal.missionRequests[0].id] || []).concat(masal);
        } else {
            uniques.push(masal);
        }
    });
    const statusOrder = [
        {
            missionStatus: "חדש",
            adminLevel: 0
        },
        {
            missionStatus: "לא אושר",
            adminLevel: 0
        },
        {
            missionStatus: "חדש",
            adminLevel: 1
        },
        {
            missionStatus: "לא אושר",
            adminLevel: 1
        },
        {
            missionStatus: "אושר"
        },
        {
            missionStatus: "בביצוע"
        },
        {
            missionStatus: "בוצע"
        }
    ];

    const compareMasalAndStatus = masal => status => masal.missionStatus === status.missionStatus &&
        (status.adminLevel === undefined || parseInt(masal.adminLevel) === status.adminLevel);

    const selectedDuplicates = Object.values(duplicates).map(similarMasals => {
        return similarMasals.sort((masal1, masal2) => {
            const masal1Index = statusOrder.findIndex(compareMasalAndStatus(masal1));
            const masal2Index = statusOrder.findIndex(compareMasalAndStatus(masal2));
            return masal2Index - masal1Index;
        })[0];
    });

    return [...uniques, ...selectedDuplicates];
}

const convertUsers = oldUsers => {
    const oldAdmin = oldUsers.find(({ level }) => parseInt(level) === 2);
    const admin = {
        _id: oldAdmin._id,
        type: "admin",
        pw: oldAdmin.pw,
        name: oldAdmin.name
    };

    const users = oldUsers
        .filter(({ level }) => parseInt(level) === 1)
        .flatMap(oldDesk => {
            const desk = {
                _id: oldDesk._id,
                type: "desk",
                pw: oldDesk.pw,
                name: oldDesk.name,
                parentId: admin._id
            };

            const deskUsers = oldUsers
                .filter(({ level, type }) => parseInt(level) === 0 && type === oldDesk.type)
                .map(oldUser => ({
                    _id: oldUser._id,
                    type: "user",
                    name: oldUser.name,
                    parentId: desk._id
                }));

            return [desk, ...deskUsers];
        });

    return [admin, ...users];
};

const getUserOrders = users => {
    adminId = users.find(({ type }) => type === "admin")._id;

    const deskNamesOrder = [
        "מחוזות",
        'יכולות צה"ל',
        "משרדי ממשלה",
        'ארגוני כ"א',
        "צריכים מנטאליים",
        "ארגוני מזון",
        "כלכלי חברתי"
    ].map(deskName => "ראש דסק " + deskName);
    const desks = users.filter(({ parentId }) => parentId === adminId)
        .sort((desk1, desk2) => deskNamesOrder.indexOf(desk1.name) - deskNamesOrder.indexOf(desk2.name));

    const adminOrder = {
        _id: adminId,
        type: "admin",
        order: desks.map(({ _id }) => _id)
    };
    const deskOrders = desks.map(desk => ({
        _id: desk._id,
        type: "desk",
        order: users.filter(({ parentId }) => parentId === desk._id).map(({ _id }) => _id)
    }));

    return [adminOrder, ...deskOrders];
};

const convertMasals = (masals, users) => {
    const userNameToId = users.reduce((final, user) => {
        final[user.name] = user._id;
        return final;
    }, {});
    const deletedUsers = [];

    const getUserIdByName = userName => {
        let id = userNameToId[userName];
        if (!id) {
            const user = deletedUsers.find(user => user.name === userName);
            id = user && user._id;
            if (!id) {
                id = new ObjectID().toHexString();
                deletedUsers.push({
                    _id: id,
                    type: "deleted",
                    name: userName
                });
            }
        }
        return id;
    };

    const masalToMissionAndTasks = masal => {
        let mission = {}, tasks = [];
        mission._id = masal._id;
        mission.senderUserId = getUserIdByName(masal.senderName);
        mission.senderDeskId = getUserIdByName("ראש דסק " + masal.senderGroup);
        mission.location = masal.missionLocation || null;
        mission.reshut = masal.missionReshut;
        mission.urgency = masal.missionUrgency;
        mission.urgencyExplanation = masal.urgencyExplanation || null;
        mission.startDate = masal.missionStartDate;
        mission.finishDate = masal.missionFinishDate;
        mission.openedDate = masal.missionOpened;
        mission.name = masal.missionName || null;
        mission.basicFullName = masal.basicFullName || null;
        mission.basicPhoneNumber = masal.basicPhoneNumber || null;
        mission.basicRole = masal.basicRole || null;

        if (masal.missionStatus === "חדש") {
            if (masal.adminLevel === 0) {
                mission.status = "new";
            } else {
                mission.status = "deskApproved";
                mission.deskMessage = masal.confirmMessage || null;
                mission.senderAdminId = adminId;
            }
        } else if (masal.missionStatus === "לא אושר") {
            if (masal.adminLevel === 0) {
                mission.status = "deskRejected";
                mission.deskMessage = null;
            } else {
                mission.status = "adminRejected";
                mission.deskMessage = masal.confirmMessage || null;
                mission.adminMessage = null;
                mission.senderAdminId = adminId;
            }
        } else {
            mission.status = "adminApproved";
            mission.deskMessage = null;
            mission.adminMessage = masal.confirmMessage || null;
            mission.senderAdminId = adminId;
        }

        mission.tasks = masal.missionRequests.map(masalTask => ({
            _id: masalTask.id,
            category: masalTask.category,
            subCategory: masalTask.subCategory,
            details: masalTask.details === masalTask.subCategory ? null : (masalTask.details || null),
            amount: parseInt(masalTask.amount)
        }));

        if (mission.status === "adminApproved") {
            let taskStatus,
                taskReceivingAdminId = adminId,
                taskReceivingDeskId = getUserIdByName(masal.receivingGroup),
                taskReceivingUserId = null;

            if (masal.missionStatus === "אושר") {
                taskStatus = "desk";
            } else if (masal.missionStatus === "בביצוע") {
                taskStatus = "user";
                taskReceivingUserId = getUserIdByName(masal.receivingName);
            } else if (masal.missionStatus === "בוצע") {
                taskStatus = "done";
                taskReceivingUserId = getUserIdByName(masal.receivingName);
            }

            const missionForTask = {
                ...mission
            };
            delete missionForTask.tasks;
            delete missionForTask.status;

            tasks = mission.tasks.map(task => {
                task.status = taskStatus;
                task.receivingAdminId = taskReceivingAdminId;
                task.receivingDeskId = taskReceivingDeskId;
                if (taskReceivingUserId) { task.receivingUserId = taskReceivingUserId; }

                return {
                    ...task,
                    mission: missionForTask
                };
            });
        }

        return {
            mission,
            tasks
        }
    };

    return masals.map(masalToMissionAndTasks).reduce((final, { mission, tasks }) => {
        final.missions.push(mission);
        final.tasks.push(...tasks);
        return final;
    }, { missions: [], tasks: [], users: users.concat(deletedUsers) });
}