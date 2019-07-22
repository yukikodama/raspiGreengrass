'use strict';

const ggSdk = require('aws-greengrass-core-sdk');
const aws = require('aws-sdk');
const docClient = new aws.DynamoDB.DocumentClient({region: "us-east-1"});
const iotClient = new ggSdk.IotData();
const GrovePi = require('node-grovepi').GrovePi;
const sensorId = require('proc-cpuinfo')()["Serial"][0];
const createAt = new Date().getTime();

const a0 = new GrovePi.sensors.base.Analog(0);
const d2 = new GrovePi.sensors.DigitalInput(2);
const d3 = new GrovePi.sensors.DigitalOutput(3);
const d4 = new GrovePi.sensors.DigitalOutput(4);

const publishCallback = async (err, data) => {
    console.error("publishCallback error: ", await err);
    console.log("publishCallback data: ", await data);
}

const onErrorFunction = async (err) => {
    console.error("onError: ", JSON.stringify(await err, null, 2));
}

const onInitFunction = async () => {
    const sensor = {TableName: "Sensor", Item: {SensorId: sensorId}};
    docClient.put(sensor, function (err, data) {
        console.log("Put Sensor succeeded:");
    });
    setInterval(function(){intervalExecute()}, 10000);
}

const intervalExecute = async () => {
    const light = Number(a0.read());
    const pir   = Number(d2.read());
    const updateAt = new Date().getTime();
    const message = {SensorId: sensorId, UpdateAt: updateAt, During: 0, Light: light, Pir: pir, CreateAt: createAt};
    const putItem = {TableName: "PirSensor", Item: message};
    const pubOpt = {
        topic: 'topic/pirSensor',
        payload: JSON.stringify(message)
    };
    docClient.put(putItem, function (err, data) {
        if (err) {
            console.error("Unable to put item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("PutItem succeeded:", JSON.stringify(data, null, 2));
        }
    });
    iotClient.publish(pubOpt, publishCallback);
}

const board = new GrovePi.board({
    debug: true,
    onError: onErrorFunction,
    onInit: onInitFunction
});
board.init();

exports.handler = async (event, context, callback) => {
    console.log("event: ", event);
    console.log("context:", context);
    callback(null, 'ok')
}