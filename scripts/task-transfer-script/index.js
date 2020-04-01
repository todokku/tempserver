const dal = require('./dal');
const fetch = require('node-fetch');
let adminId;

(async () => {
    const masalsUrl = "https://masaldev.herokuapp.com/getAllTasks";
    const usersUrl = "https://masaldev.herokuapp.com/getAllUsers";
    const mongoUrl = 'mongodb+srv://admin:admin@cluster0-3ftjv.mongodb.net/test?retryWrites=true&w=majority';
    const dbName = 'dashboard-new';
    const usersCollectionName = "users-amitai";
    const missionsCollectionName = "missions-amitai";
    const tasksCollectionName = "tasks-amitai";

    await dal.init(mongoUrl, dbName);
    const usersCollection = dal.getTable(usersCollectionName);
    const missionsCollection = dal.getTable(missionsCollectionName);
    const tasksCollection = dal.getTable(tasksCollectionName);

    const oldUsers = await fetch(usersUrl).then(result => result.json());
    const users = convertUsers(oldUsers);
    adminId = users.find(({ type }) => type === "admin")._id;

    let masals = await fetch(masalsUrl).then(result => result.json());
    console.log("before uniq: ", masals.length);
    masals = masals.filter(m => m.missionRequests.length > 0); //Get rid of masals without tasks. 
    masals = uniq(masals, masal => masal.missionRequests[0].id); //Get rid of duplicates. They exist. see task id 10_5obajdjz5
    console.log("after uniq: ", masals.length);

    const { missions, tasks } = convertMasals(masals, users);

    await usersCollection.insertMany(users);
    await missionsCollection.insertMany(missions);
    await tasksCollection.insertMany(tasks);
})().then(() => console.log("done")).catch(e => console.error(e));

const uniq = (data, extractKey = x => x) => {
    return data.map((item, i) => data
        .slice(i + 1)
        .some(innerItem => extractKey(innerItem) === extractKey(item)) ? null : item
    ).filter(item => item !== null);
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
}

const convertMasals = (masals, users) => {
    const usersNameMap = users.reduce((final, user) => {
        final[user.name] = user;
        return final;
    }, {});

    const masalToMissionAndTasks = masal => {
        let mission = {}, tasks = [];
        mission._id = masal._id;
        mission.senderUserId = usersNameMap[masal.senderName]._id;
        mission.senderDeskId = usersNameMap["ראש דסק " + masal.senderGroup]._id;
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
                taskReceivingDeskId = usersNameMap[masal.receivingGroup]._id,
                taskReceivingUserId = null;

            if (masal.missionStatus === "אושר") {
                taskStatus = "desk";
            } else if (masal.missionStatus === "בביצוע") {
                taskStatus = "user";
                taskReceivingUserId = usersNameMap[masal.receivingName]._id;
            } else if (masal.missionStatus === "בוצע") {
                taskStatus = "done";
                taskReceivingUserId = usersNameMap[masal.receivingName]._id;
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
    }, { missions: [], tasks: [] });
}