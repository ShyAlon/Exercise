const express = require('express');
const bodyParser = require("body-parser");
const { ungzip } = require('node-gzip');
const request = require('request');


const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const port = 3000;

app.get('/', (req, res) => res.send('Hello World!'))

async function getDecompressedData(source) {
    const json = Buffer.from(source, 'base64');
    const str = (await ungzip(json)).toString();
    const obj = JSON.parse(str);
    return obj;
}

function enqueue(queue, data){
    setImmediate(async () => {
        request.post(
            "http://localhost:8080/api/enqueue/v1",
            {json: {data, queue}},
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

async function handleData(request, response, queueName){
    const data = await getDecompressedData(request.body.data);
    console.log("Data", data);
    response.status(200).send("OK");
    enqueue(queueName, data);
}

app.post('/api/visit/v1', async function (request, response) {
    await handleData(request, response, 'visit');
});

app.post('/api/activity/v1', async function (request, response) {
    await handleData(request, response, 'activity');
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))