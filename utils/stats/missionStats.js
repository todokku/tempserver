const _ = require('lodash');
const moment = require("moment");
const { getTable } = require('../../dal');

const missionsCollection = getTable('missions');
const NUM_OF_DAYS = 8;

function getLastDays(numOfDays) {
    const days = [];
    for (let i = 0; i < numOfDays; i++) {
        date = moment().utc(true);
        date.subtract(i, 'day').startOf('day');
        days.push(date.format("DD/MM"));
    }

    return days;
};

async function getLastWeekStats() {
    return new Promise((resolve, reject) => {
        missionsCollection.find({}).toArray((err, missions) => {
            const lastSevenDays = getLastDays(NUM_OF_DAYS);
            const creationDates = missions.map(mission => moment(mission.openedDate).utc(true));
            const groupedDays = _.groupBy(creationDates, date => {
                const utcDate = date.utc();
                return utcDate.startOf('day').format();
            });

            // Make an object that includes count of each day we grouped.
            const groupedDaysWithCount = {};
            Object.keys(groupedDays).forEach(key => {
                const dayKeyFormatted = moment(key).utc(true).format("DD/MM");
                if (lastSevenDays.includes(dayKeyFormatted)) {
                    groupedDaysWithCount[dayKeyFormatted] = groupedDays[key].length;
                }
            });

            // Put 0 to days that do not have any missions
            lastSevenDays.forEach(day => {
                if (groupedDaysWithCount[day] === undefined) {
                    groupedDaysWithCount[day] = 0;
                }
            })
            resolve(groupedDaysWithCount);
        });
    });
}

module.exports = {
    getLastWeekStats
}