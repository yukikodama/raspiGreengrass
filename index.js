'use strict';

const aws = require('aws-sdk');
const docClient = new aws.DynamoDB.DocumentClient({region: "us-east-1"});

exports.handler = (event, context, callback) => {
    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? err.message : JSON.stringify(res),
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
    });
    docClient.scan({TableName : 'PirSensor'}, done);
}