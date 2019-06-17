'use strict';

const ggSdk = require('aws-greengrass-core-sdk');
const aws = require('aws-sdk');
const docClient = new aws.DynamoDB.DocumentClient({region: "us-east-1"});
const iotClient = new ggSdk.IotData();
const os = require('os');
const util = require('util');

function publishCallback(err, data) {
    console.log(err);
    console.log(data);
}

const myPlatform = util.format('%s-%s', os.platform(), os.release());
const pubOpt = {
    topic: 'topic/sensor',
    payload: JSON.stringify({ message: util.format('Hello world! Sent from Greengrass Core running on platform: %s using NodeJS', myPlatform) }),
};

function greengrassHelloWorldRun() {
    var params = {
        TableName: "MySensor",
        Key: {"id": "1"},
        UpdateExpression: "set pir = :p, sensor = :s",
        ExpressionAttributeValues: {":p": "test_value_xx", ":s" : "sensor"},
        ReturnValues:"UPDATED_NEW"
    };
    docClient.update(params, function(err, data) {
        if (err) {
            console.log(err);
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
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
    console.log(event);
    console.log(context);
};
