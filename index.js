'use strict';

const aws = require('aws-sdk');
const docClient = new aws.DynamoDB.DocumentClient({region: "us-east-1"});

const docClientFunction = async(params, scan = false) => {
    return new Promise(async(resolve, reject) => {
        if (scan) {
            docClient.scan(params, async(err, data) => {
                resolve(await data.Items);
        });
        }
        else {
            docClient.query(params, async(err, data) => {
                resolve(await data.Items);
            });
        }
    });
};

const cfRoomSensorParams = {
    TableName: 'cfRoomSensor',
    KeyConditionExpression: "#si = :s",
    ExpressionAttributeNames: {
        "#si": "SensorId"
    },
    ExpressionAttributeValues: {},
    ScanIndexForward: false,
    Limit: 60
};

exports.handler = async (event, context, callback) => {
    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? err.message : JSON.stringify(res),
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
    });
    const s = await docClientFunction({ TableName: 'PirSensor' }, true);
    console.info("s: ", s);
    var array = [];
    for (var i of s) {
        cfRoomSensorParams.ExpressionAttributeValues = { ":s": i.SensorId };
        const item = await docClientFunction(cfRoomSensorParams);
        array = array.concat(item);
    }
    console.info("array: ", array);
    callback(null, {
        statusCode: '200',
        body:  JSON.stringify(array),
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
    });
}