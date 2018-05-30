const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const dbPath = require('./config').dbPath;

let app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', (req, res) => {
	res.send('Hello world!');
});

mongoose.connect(dbPath);
const db = mongoose.connection;
db.on('error', console.log('connection error'));
db.once('open', function() {
	let server = app.listen(process.env.PORT || 3000, () => {
		let host = server.address().address;
		let port = server.address().port;

		console.log('Example app listening at http://localhost:%s', port);
	});
});