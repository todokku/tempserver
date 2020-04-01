const USERS_ROUTE = 'users';
const DESKS_ROUTE = 'desks';
const MISSIONS_ROUTE = 'missions';
const TASKS_ROUTE = 'tasks';
const ADMINS_ROUTE = 'admins';
const USER_ORDERS_ROUTE = 'user-orders';

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
        baseRoute: ADMINS_ROUTE,
        controller: require('./admins')
    },
    {
        baseRoute: USER_ORDERS_ROUTE,
        controller: require('./user-orders')
    }
];

module.exports = Controllers;