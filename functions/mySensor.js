'use strict';

const ggSdk = require('aws-greengrass-core-sdk');
const aws = require('aws-sdk');
const docClient = new aws.DynamoDB.DocumentClient({region: "us-east-1"});
const iotClient = new ggSdk.IotData();
const os = require('os');
const util = require('util');
const fs  = require('fs');
const ip = "192.168.1.1";

function publishCallback(err, data) {
    console.log(err);
    console.log(data);
}

const myPlatform = util.format('%s-%s', os.platform(), os.release());
const pubOpt = {
    topic: 'topic/sensor',
    payload: JSON.stringify({message: util.format('Hello world! Sent from Greengrass Core running on platform: %s using NodeJS, IP: %s', myPlatform, ip)}),
};

function greengrassHelloWorldRun() {
    const irf = os.networkInterfaces();
    console.log("networkInterfaces:", irf);
    var params = {
        TableName: "MySensor",
        Key: {"ip": ip, "sensor" : "D2"},
        UpdateExpression: "set during = during + :d",
        ExpressionAttributeValues: {":d": 5000},
        ReturnValues: "UPDATED_NEW"
    };
    // docClient.update(params, function (err, data) {
    //      if (err) {
    //          console.error(err);
    //          console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
    //      } else {
    //          console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
    //      }
    // });
    iotClient.publish(pubOpt, publishCallback);
}

// Schedule the job to run every 5 seconds
setInterval(greengrassHelloWorldRun, 5000);

// This is a handler which does nothing for this example
exports.handler = function handler(event, context) {
    console.log("event: ", event);
    console.log("context:", context);
};
