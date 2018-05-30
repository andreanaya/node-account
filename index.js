const api = require('./app/api');
const mongoose = require('mongoose');

let server = api.server(() => {
	var port = server.address().port;
	console.log('Example app listening at http://localhost:%s', port);

	api.db().then(() => {
		console.log('DB connected');
	})
});