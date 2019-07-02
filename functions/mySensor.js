'use strict';

const ggSdk = require('aws-greengrass-core-sdk');
const aws = require('aws-sdk');
const docClient = new aws.DynamoDB.DocumentClient({region: "us-east-1"});
const iotClient = new ggSdk.IotData();
const os = require('os');
const util = require('util');
const uuid = require('node-uuid');
const grovePi = require('node-grovepi').GrovePi;
const digital = grovePi.sensors.base.Digital;
const id = uuid.v4().split('-').join('');
const serial = require('proc-cpuinfo')()["Serial"][0];

var createTime = new Date().getTime();

function publishCallback(err, data) {
    console.log(err);
    console.log(data);
}

const myPlatform = util.format('%s-%s', os.platform(), os.release());

const board = new grovePi.board({
    debug: true,
    onError: function (err) {
        console.log(err);
    },
    onInit: function (res) {
        const dPir = new digital(3);
        setInterval(function () {
            const now = new Date().getTime();
            var pir = Number(dPir.read());
            const reset = {
                TableName: "MyPirSensor",
                Key: {"Id": id, "Serial": serial},
                UpdateExpression: "set During = :d",
                ExpressionAttributeValues: {":d": 0},
                ReturnValues: "UPDATED_NEW"
            };
            if (pir) {
                const countup = {
                    TableName: "MyPirSensor",
                    Key: {"Id": id, "Serial": serial},
                    UpdateExpression: "set During = During + :d",
                    ExpressionAttributeValues: {":d": 5000},
                    ReturnValues: "UPDATED_NEW"
                };
            } else {
                docClient.put(reset, function (err, data) {
                    if (err) {
                        console.error(err);
                        console.error("reset: ", JSON.stringify(data, null, 2));
                        console.error("Unable to Put item. Error JSON:", JSON.stringify(err, null, 2));
                    } else {
                        console.log("Put Item succeeded:", JSON.stringify(data, null, 2));
                    }
                });
            }
            const pubOpt = {
                topic: 'topic/sensor',
                payload: JSON.stringify({message: util.format('Sent from Greengrass Core running on platform: %s using NodeJS, Id: %s, serial: %s, createTime: %s, now: %s, pir: %s', myPlatform, id, serial, createTime, now, pir)})
            };
            iotClient.publish(pubOpt, publishCallback);
        }, 5000);
    }
});
board.init();

exports.handler = function handler(event, context) {
    console.log("event: ", event);
    console.log("context:", context);
};
