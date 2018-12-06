const request = require('request');

let records = { visit: [], activity: [] };
let lastTime = { visit: Date.now(), activity: Date.now()};
const maxWait = 1000 * 60 * 2;

function processRecords(type) {
    // TODO: Time is running short so instead of writing I'm logging
    // The array is copied so it would not get changed during perssistance to file system
    // since writing files takes time.
    const array = records[type];
    records[type] = [];
    console.log(`${type}_${Date.now()}`, array);
}

function getRecordType(type) {
    let timeout = 1000;
    request(`http://localhost:8080/api/dequeue/${type}/v1`, function (error, response, body) {
        try {
            body = body ? JSON.parse(body) : {error: "boday was null"};
            if (error || body.error) {
                console.error(`failed to get ${type} record`);
            } else if (body.item) {
                records[type].push(body.item);
                if (records[type].length >= 100 || ((Date.now() - lastTime[type] >= maxWait) && records[type].length > 0)) {
                    processRecords(type);
                }
                timeout = 1;
            }
        } catch (error) {
            console.error(error);
        }
        setTimeout(() => {
            getRecordType(type);
        }, timeout);
    });
}

getRecordType('activity');
getRecordType('visit');