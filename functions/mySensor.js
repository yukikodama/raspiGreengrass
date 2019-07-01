'use strict';

const ggSdk = require('aws-greengrass-core-sdk');
const aws = require('aws-sdk');
const docClient = new aws.DynamoDB.DocumentClient({region: "us-east-1"});
const iotClient = new ggSdk.IotData();
const os = require('os');
const util = require('util');
const uuid = require('node-uuid');
const grovePi = require('node-grovepi').GrovePi;

const id = uuid.v4().split('-').join('');
var createTime = new Date().getTime();

function publishCallback(err, data) {
    console.log(err);
    console.log(data);
}

const myPlatform = util.format('%s-%s', os.platform(), os.release());

const board = new GrovePi.board({
    debug: true,
    onError: function (err) {
        console.log(err);
    },
    onInit: function (res) {
        setInterval(function () {
            const now = new Date().getTime();
            const d3  = new grovePi.sensors.DigitalOutput(3);
            const pir = Number(d3.read());
            const pubOpt = {
                topic: 'topic/sensor',
                payload: JSON.stringify({message: util.format('Sent from Greengrass Core running on platform: %s using NodeJS, Id: %s, createTime: %s, now: %s, pir: %s', myPlatform, id, createTime, now, pir)}),
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
