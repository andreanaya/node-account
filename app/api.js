const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const config = require('./config')[process.env.NODE_ENV];

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
	res.send('Hello world!');
});

module.exports = {
	app: app,
	server: (done) => {
		return app.listen(process.env.PORT || 3000, done);
	},
	db: () => {
		return new Promise((resolve, reject) => {
			mongoose.connect(config.db);
			mongoose.connection.on('error', () => {
				reject();
			});
			mongoose.connection.once('open', function() {
				resolve();
			});
		});
	}
}