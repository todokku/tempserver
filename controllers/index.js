const USERS_ROUTE = 'users';
const DESKS_ROUTE = 'desks';
const MISSIONS_ROUTE = 'missions';
const TASKS_ROUTE = 'tasks';
const ADMIN_ROUTE = 'admins';

const Controllers = [
    {
        baseRoute: USERS_ROUTE,
        controller: require('./users')
    },
    {
        baseRoute: MISSIONS_ROUTE,
        controller: require('./missions')
    },
    {
        baseRoute: DESKS_ROUTE,
        controller: require('./desks')
    },
    {
        baseRoute: TASKS_ROUTE,
        controller: require('./tasks')
    },
    {
        baseRoute: ADMIN_ROUTE,
        controller: require('./admins')
    }
];

module.exports = Controllers;