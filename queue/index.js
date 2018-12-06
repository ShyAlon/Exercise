const express = require('express');
const bodyParser = require("body-parser");
var locks = require('locks');
var mutex = locks.createMutex();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const port = 8080;

app.get('/', (req, res) => res.send('Hello Queue World!'))

const queues = { activity: [], visit: [] }
const MAX_LENGTH = 10000;

/**
 * Enqueues an item unless the queue is at maximum capacity
 */
app.post('/api/enqueue/v1', async function (request, response) {
    mutex.lock(function () {
        try {
            if (queues[request.body.queue].length >= MAX_LENGTH) {
                throw Error(`Queue exceeds max length of ${MAX_LENGTH}`)
            }
            if (request.body.data) {
                queues[request.body.queue].push(request.body.data);
                // Not handling invalid queue name ATM
                response.send("OK");
            }
        } catch (error) {
            console.error(error);
            response.status(500).json({ error });
        }
        mutex.unlock();
    });
});

function dequeue(queue, response) {
    mutex.lock(function () {
        try {
            if (queue.length === 0) {
                response.status(400).json({ error: "queue is empty" });
            } else {
                const item = queue[0];
                queue.shift();
                response.status(200).json({ item });
            }
        } catch (error) {
            console.error(error);
            response.status(500).json({ error });
        }
        mutex.unlock();
    });
}
/**
 * Returns the item in the response if the queue has an item to dequeue
 */
app.get('/api/dequeue/activity/v1', async function (request, response) {
    dequeue(queues.activity, response);
});

app.get('/api/dequeue/visit/v1', async function (request, response) {
    dequeue(queues.visit, response);
});

app.listen(port, () => console.log(`Queue app listening on port ${port}!`))