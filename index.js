const fs = require('fs');
const https = require('https');
const mongoose = require('mongoose');
const app = require('./app/index');

let server = https.createServer({
	key: fs.readFileSync('./keys/key.pem'),
	cert: fs.readFileSync('./keys/cert.pem')
}, app).listen(process.env.PORT || 3000, async () => {
	await mongoose.connect(process.env.MONGODB_URI);
	console.log('Example app listening at https://localhost:%s', server.address().port);
});