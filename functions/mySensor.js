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
        const params = {
            TableName: "MySensor",
            Key: {"Id": id, "Sensor": serial},
        };
        setInterval(function () {
            const now = new Date().getTime();
            var pir = Number(dPir.read());
            const message = {Id :id, Sensor: serial, During : 0, Pir: pir, CreateTIme: createTime, UpdateTime: now};
            if (pir) {

            } else {
                const v = {
                    TableName: "MySensor",
                    Item: message
                };
                docClient.put(v, function(err, data) {
                    if (err) {
                        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                    }
                    else {
                        console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                    }
                });
            }
            const pubOpt = {
                topic: 'topic/sensor',
                payload: JSON.stringify(message)
                // payload: JSON.stringify({message: util.format('Sent from Greengrass Core running on platform: %s using NodeJS, Id: %s, serial: %s, createTime: %s, now: %s, pir: %s', myPlatform, id, serial, createTime, now, pir)})
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
