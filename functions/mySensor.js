'use strict';

const ggSdk = require('aws-greengrass-core-sdk');
const aws = require('aws-sdk');
const docClient = new aws.DynamoDB.DocumentClient({region: "us-east-1"});
const iotClient = new ggSdk.IotData();
const os = require('os');
const util = require('util');
const uuid = require('node-uuid');
const id = uuid.v4().split('-').join('');

function publishCallback(err, data) {
    console.log(err);
    console.log(data);
}

const myPlatform = util.format('%s-%s', os.platform(), os.release());
const pubOpt = {
    topic: 'topic/sensor',
    payload: JSON.stringify({message: util.format('Hello world! Sent from Greengrass Core running on platform: %s using NodeJS, ID: %s', myPlatform, id)}),
};

const countup = {
    TableName: "MySensor",
    Key: {"id": id, "sensor": "D2"},
    UpdateExpression: "set during = during + :d",
    ExpressionAttributeValues: {":d": 5000},
    ReturnValues: "UPDATED_NEW"
};

const reset = {
    TableName: "MySensor",
    Key: {"id": id, "sensor": "D2"},
    UpdateExpression: "set during = :d",
    ExpressionAttributeValues: {":d": 0},
    ReturnValues: "UPDATED_NEW"
};

function greengrassHelloWorldRun() {
    const params = {
        TableName: "MySensor",
        Key: {"id": id, "sensor": "D2"}
    };
    docClient.get(params, function (err, data) {
        if (Object.keys(data).length) {
            docClient.update(countup, function (err, data) {
                if (err) {
                    console.error(err);
                    console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                }
            });
        } else {
            docClient.put(reset, function (err, data) {
                if (err) {
                    console.error(err);
                    console.error("Unable to Put item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Put Item succeeded:", JSON.stringify(data, null, 2));
                }
            });
        }
    });
    iotClient.publish(pubOpt, publishCallback);
}

// Schedule the job to run every 5 seconds
setInterval(greengrassHelloWorldRun, 5000);

// This is a handler which does nothing for this example
exports.handler = function handler(event, context) {
    console.log("event: ", event);
    console.log("context:", context);
};
