const nodemailer = require('nodemailer');
let aws = require('aws-sdk');

aws.config.loadFromPath('aws.json');

let transporter = nodemailer.createTransport({
    SES: new aws.SES({
        apiVersion: '2012-10-17'
    })
});

module.exports = transporter;