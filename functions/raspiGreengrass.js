'use strict';

console.log('Loading function');
const ggSdk = require('aws-greengrass-core-sdk');
const iotClient = new ggSdk.IotData();
const os = require('os');
const util = require('util');
const GrovePi = require('node-grovepi').GrovePi;
const Analog = GrovePi.sensors.base.Analog;
const DHTDigitalSensor = GrovePi.sensors.DHTDigital;

var m = -1, t = -1, h = -1;
const myPlatform = util.format('%s-%s', os.platform(), os.release());

function publishCallback(err, data) {
    console.log(err);
    console.log(data);
}

const board = new GrovePi.board({
    debug: true,
    onError: function (err) {
        console.log(err);
    },
    onInit: function (res) {
        const a2 = new Analog(2);
        const dht2 = new DHTDigitalSensor(2, DHTDigitalSensor.VERSION.DHT11, DHTDigitalSensor.CELSIUS);
        setInterval(function () {
            const dht = dht2.read();
            m = Number(a2.read());
            t = dht[0];
            h = dht[1];
            iotClient.publish({
                topic: 'raspi/topic',
                payload: JSON.stringify({
                    moisture: m,
                    temperature: t,
                    humidity: h,
                    platform: myPlatform,
                    message: "from Greengrass Core and NodeJS."
                })
            }, publishCallback);
        }, 5000);
    }
});
board.init();

exports.handler = function (event, context, callback) {
    console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('Received context:', JSON.stringify(context, null, 2));
};