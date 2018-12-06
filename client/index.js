const request = require('request');
const uuidv4 = require('uuid/v4');
const { gzip } = require('node-gzip');


const index = process.argv[2];
const interval = process.argv[3];
const UserId = uuidv4();
const ExitTimeDelta = 40 * 60 * 1000;
const EndTimeDelta = 30 * 60 * 1000;

console.log(`Process number ${index} with interval ${interval} user ID ${UserId}`);

/**
 * Returns random integer from 0 to max
 * @param {Interger} max 
 */
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

/**
 * Add hours to date
 * @param {*} h 
 */
Date.prototype.addHours = function (h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

function getRandomActivityType() {
    return Math.pow(2, getRandomInt(5));
}

function getRandomInRange(from, to, fixed) {
    return (Math.random() * (to - from) + from).toFixed(fixed) * 1;
}

function createVisit(enterTime) {
    return {
        DataVer: 1,
        UserId,
        EnterTime: enterTime,
        ExitTime: enterTime + ExitTimeDelta,
        AlgorithmType: getRandomInt(6) + 1,
        PoiId: uuidv4(), // Int64 is not supported in Javascript so for the sake of uniqueness uuid is used
        Latitude: getRandomInRange(-180, 180, 3),
        Longitude: getRandomInRange(-180, 180, 3),
    }
}

function createActivity(startTime) {
    return {
        DataVer: 1,
        UserId,
        ActivityType: getRandomActivityType(),
        StartTime: startTime,
        EndTime: startTime + EndTimeDelta,
        StartLatitude: getRandomInRange(-180, 180, 3),
        StartLongitude: getRandomInRange(-180, 180, 3),
        EndLatitude: getRandomInRange(-180, 180, 3),
        EndLongitude: getRandomInRange(-180, 180, 3),
    }
}

function sendRecord(record, endpoint) {
    setImmediate(async () => {
        const str = JSON.stringify(record);
        const zipped = await gzip(str);

        // console.log(Buffer.from('Hello World!').toString('base64'));
        // console.log(Buffer.from(b64Encoded, 'base64').toString());
        const base64 = Buffer.from(zipped).toString('base64');
        // console.log('item', {str, base64});
        request.post(
            endpoint,
            {json: {data: base64}},
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body)
                } else {
                    console.error(error);
                }
            }
        );
    });
}

let activityTime = new Date(2018, 1, 1, 1, 0, 0);
let visitTime = new Date(2018, 1, 1, 0, 0, 0);

// Not defined - run for a 1000 days for now

for (let i = 0; i < 1000; i++) {
    const visits = [];
    const activities = [];
    for (let h = 0; h < 12; h++) {
        visits.push(createVisit(visitTime));
        activities.push(createActivity(activityTime));
        activityTime.addHours(2);
        visitTime.addHours(2);
    }
    sendRecord(visits, 'http://localhost:3000/api/visit/v1');
    sendRecord(activities, 'http://localhost:3000/api/activity/v1');
}