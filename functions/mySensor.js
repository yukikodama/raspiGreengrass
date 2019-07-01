'use strict';

const ggSdk = require('aws-greengrass-core-sdk');
const aws = require('aws-sdk');
const docClient = new aws.DynamoDB.DocumentClient({region: "us-east-1"});
const iotClient = new ggSdk.IotData();
const os = require('os');
const util = require('util');
const uuid = require('node-uuid');
const grovePi = require('node-grovepi').GrovePi;
const d3  = new grovePi.sensors.DigitalOutput(3);

const id = uuid.v4().split('-').join('');
var create_time = new Date().getTime();

function publishCallback(err, data) {
    console.log(err);
    console.log(data);
}

const myPlatform = util.format('%s-%s', os.platform(), os.release());
const pubOpt = {
    topic: 'topic/sensor',
    payload: JSON.stringify({message: util.format('Hello world! Sent from Greengrass Core running on platform: %s using NodeJS, ID: %s', myPlatform, id)}),
};

function greengrassHelloWorldRun() {
    const now = new Date().getTime();
    const pir = Number(d3.read());
    console.log("pir: ", pir);
    const countup = {
        TableName: "MySensor",
        Key: {"id": id, "create_time": create_time},
        UpdateExpression: "set during = during + :d, update_time = :t",
        ExpressionAttributeValues: {":d": 5000, ":t": now},
        ReturnValues: "UPDATED_NEW"
    };

    docClient.update(countup, function (err, data) {
        if (err) {
            console.error(err);
            const reset = {
                TableName: "MySensor",
                Key: {"id": id, "create_time": now},
                UpdateExpression: "set during = :d, update_time = :t",
                ExpressionAttributeValues: {":d": 0, ":t": now},
                ReturnValues: "UPDATED_NEW"
            };
            docClient.put(reset, function (err, data) {
                if (err) {
                    console.error(err);
                    console.error("Unable to Put item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Put Item succeeded:", JSON.stringify(data, null, 2));
                }
            });
            create_time = now;
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
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
