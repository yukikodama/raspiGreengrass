'use strict';

const ggSdk = require('aws-greengrass-core-sdk');
const aws = require('aws-sdk');
const docClient = new aws.DynamoDB.DocumentClient({region: "us-east-1"});
const iotClient = new ggSdk.IotData();
const GrovePi = require('node-grovepi').GrovePi;
const sensorId = require('proc-cpuinfo')()["Serial"][0];
const createAt = new Date().getTime();

const a0 = new GrovePi.sensors.base.Analog(0);
const a1 = new GrovePi.sensors.base.Analog(1);
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
    setInterval(function(){intervalExecute()}, 1000);
}

const intervalExecute = async () => {
    const light = Number(a0.read());
    const sound = Number(a1.read());
    const pir   = Number(d2.read());
    const updateAt = new Date().getTime();
    const message = {SensorId: sensorId, UpdateAt: updateAt, During: 0, Light: light, Sound: sound, Pir: pir, CreateAt: createAt, };
    const pubOpt = {
        topic: 'topic/cfRoomSensor',
        payload: JSON.stringify(message)
    };
    console.log("message: ", await message);
    iotClient.publish(pubOpt, publishCallback);
}

const board = new grovePi.board({
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