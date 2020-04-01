const USER_TYPES = require('./userTypes');

const MISSION_STATUSES = {
  NEW: 'new',
  DESK_APPROVED: 'deskApproved',
  DESK_REJECTED: 'deskRejected',
  ADMIN_APPROVED: 'adminApproved',
  ADMIN_REJECTED: 'adminRejected'
};

const TASK_STATUSES = {
  ADMIN: 'admin',
  DESK: 'desk',
  USER: 'user',
  DONE: 'done'
};

const filterByStatus = (objects, statuses) => objects.filter(obj => statuses.includes(obj.status));
const isMissionIdMatch = (mission, user) => (
  (mission.senderAdminId === user._id && user.type === USER_TYPES.ADMIN) ||
  (mission.senderDeskId === user._id && user.type === USER_TYPES.DESK) ||
  (mission.senderUserId === user._id && user.type === USER_TYPES.USER)
);

const isTaskIdMatch = (task, user) => (
  (task.recievingAdminId === user._id && user.type === USER_TYPES.ADMIN) ||
  (task.recievingDeskId === user._id && user.type === USER_TYPES.DESK) ||
  (task.recievingUserId === user._id && user.type === USER_TYPES.USER)
);

const MissionsByStatus = {
  rejected: (missions, user) => {
    missions = filterByStatus(missions, [MISSION_STATUSES.ADMIN_REJECTED, MISSION_STATUSES.DESK_REJECTED]);
    missions = missions.filter(mission => isMissionIdMatch(mission, user));

    return {
      missions
    };
  },
  approvalPending: (missions, user) => {
    let tasks = [];

    missions = filterByStatus(missions,
      user.type === 'admin' ? [MISSION_STATUSES.DESK_APPROVED] : [MISSION_STATUSES.NEW, MISSION_STATUSES.DESK_APPROVED]);
    missions = missions.filter(mission => isMissionIdMatch(mission, user));


    missions.forEach(mission => {
      //all tasks of missions that are new/deskapproved are waiting for admin approve
      tasks = [...tasks, ...mission.tasks];
    });

    return {
      missions,
      tasks
    };
  },
  associationPending: (missions, user, tasks) => {
    let associationPendingMissions = [];

    if (user.type === USER_TYPES.USER) {
      return {
        missions: [],
        tasks: []
      };
    }

    missions = filterByStatus(missions, [MISSION_STATUSES.ADMIN_APPROVED]);
    tasks = filterByStatus(tasks, [TASK_STATUSES.DESK, TASK_STATUSES.ADMIN]);
    missions.forEach(mission => {
      let allTasksAssociated = true;
      mission.tasks.forEach(task => {
        let isPending = task.recievingUserId === undefined;

        if (isPending && isTaskIdMatch(task, user)) {
          tasks.push(task);
        }

        allTasksAssociated = isPending ? allTasksAssociated : isPending;
      });
      if (!allTasksAssociated) {
        associationPendingMissions.push(missions);
      }
    });

    return {
      missions: associationPendingMissions,
      tasks
    };
  },
  inExecution: (missions, user, tasks) => {
    let executionMissions = [];
    tasks = filterByStatus(tasks, [TASK_STATUSES.USER]);
    missions = filterByStatus(missions, [MISSION_STATUSES.ADMIN_APPROVED]);

    missions.forEach(mission => {
      let allTasksInExecution = true;
      mission.tasks.forEach(task => {
        if ((isTaskIdMatch(task, user) || isMissionIdMatch(mission, user))
          && task.recievingUserId !== undefined
          && task.status === TASK_STATUSES.USER
        ) {
          tasks.push(task);
        }
        else {
          allTasksInExecution = false;
        }
      });
      if (allTasksInExecution) {
        executionMissions.push(mission);
      }
    });

    return {
      missions: executionMissions,
      tasks
    };
  },
  finishedMissions: (missions, user) => {
    const tasks = [],
      finsishedMissions = filterByStatus(missions, [MISSION_STATUSES.DESK_REJECTED, MISSION_STATUSES.ADMIN_REJECTED])
        .filter(mission => isMissionIdMatch(mission, user));
    missions = filterByStatus(missions, [MISSION_STATUSES.ADMIN_APPROVED]);
    missions.forEach(mission => {
      let allTasksFinished = true;
      mission.tasks.forEach(task => {
        if (task.status === TASK_STATUSES.DONE) {
          tasks.push(task);
        }
        else {
          allTasksFinished = false;
        }
      });
      if (allTasksFinished) {
        finsishedMissions.push(mission);
      }
    });

    return {
      missions: finsishedMissions,
      tasks
    }
  }
};

module.exports = {
  MissionsByStatus
}