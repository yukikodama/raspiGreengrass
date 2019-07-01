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
var createTime = new Date().getTime();

function publishCallback(err, data) {
    console.log(err);
    console.log(data);
}

const myPlatform = util.format('%s-%s', os.platform(), os.release());

function greengrassHelloWorldRun() {
    const now = new Date().getTime();
    console.log("id:", id);
    console.log("createTime:", createTime);
    console.log("now: ", now);
    const pubOpt = {
        topic: 'topic/sensor',
        payload: JSON.stringify({message: util.format('Sent from Greengrass Core running on platform: %s using NodeJS, ID: %s, createTime: %s, now: %s', myPlatform, id, createTime, now)}),
    };
    iotClient.publish(pubOpt, publishCallback);
}

// Schedule the job to run every 5 seconds
setInterval(greengrassHelloWorldRun, 5000);

// This is a handler which does nothing for this example
exports.handler = function handler(event, context) {
    console.log("event: ", event);
    console.log("context:", context);
};
