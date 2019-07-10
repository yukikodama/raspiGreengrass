'use strict';

const ggSdk = require('aws-greengrass-core-sdk');
const aws = require('aws-sdk');
const docClient = new aws.DynamoDB.DocumentClient({region: "us-east-1"});
const iotClient = new ggSdk.IotData();
const grovePi = require('node-grovepi').GrovePi;
const digital = grovePi.sensors.base.Digital;
const sensorId = require('proc-cpuinfo')()["Serial"][0];
const createAt = new Date().getTime();

const publishCallback = async (err, data) => {
    console.error("publishCallback error: ", await err);
    console.log("publishCallback data: ", await data);
}

const onErrorFunction = async (err) => {
    console.error("onError: ", JSON.stringify(err, null, 2));
}

const onInitFunction = async () => {
    const digitalSensor = new digital(3);
    setInterval(function(){intervalExecute(digitalSensor)}, 1000);
}

const intervalExecute = async (digitalSensor) => {
    const updateAt = new Date().getTime();
    const pir = Number(digitalSensor.read());
    console.log(await pir);

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