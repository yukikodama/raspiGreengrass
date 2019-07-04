'use strict';

const ggSdk = require('aws-greengrass-core-sdk');
const aws = require('aws-sdk');
const docClient = new aws.DynamoDB.DocumentClient({region: "us-east-1"});
const iotClient = new ggSdk.IotData();
const grovePi = require('node-grovepi').GrovePi;
const digital = grovePi.sensors.base.Digital;
const sensorId = require('proc-cpuinfo')()["Serial"][0];
const createAt = new Date().getTime();

function publishCallback(err, data) {
    console.log(err);
    console.log(data);
}

const board = new grovePi.board({
    debug: true,
    onError: function (err) {
        console.error( JSON.stringify(err, null, 2));
    },
    onInit: function (res) {
        const digitalSensor = new digital(3);
        setInterval(function () {
            const updateAt = new Date().getTime();
            const pir = Number(digitalSensor.read());
            const message = {SensorId: sensorId, During: 0, Pir: pir, CreateAt: createAt, UpdateAt: updateAt};
            if (pir) {
                const up = {
                    TableName: "MyPirSensor",
                    Key: {SensorId: sensorId},
                    UpdateExpression: "set During = During + :d, Pir = :p, CreateAt = :c, UpdateAt = :u",
                    ExpressionAttributeValues:{":d": 5000, ":p": pir, ":c": createAt,":u": updateAt},
                    ReturnValues: "UPDATED_NEW"
                };
                docClient.update(up, function(err, data) {
                    if (err) {
                        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                    }
                    else {
                        console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                        message.During = data.Attributes.During;
                    }
                });
            } else {
                const v = {TableName: "MyPirSensor", Item: message};
                docClient.put(v, function (err, data) {
                    if (err) {
                        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                    } else {
                        console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                    }
                });
            }
            const pubOpt = {
                topic: 'topic/sensor',
                payload: JSON.stringify(message)
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