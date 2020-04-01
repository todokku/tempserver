const _ = require('lodash');
const { getTable } = require('../../dal');

const tasksCollection = getTable('tasks');

async function getTaskStats() {
    return new Promise((resolve, reject) => {
        tasksCollection.find({}).toArray((err, tasks) => {
            const types = _.countBy(tasks, "category");
            resolve(types);
        });
    });
}

module.exports = {
    getTaskStats
}