const app = require('./app/index');
const mongoose = require('mongoose');

let server = app.listen(process.env.PORT || 3000, async () => {
	await mongoose.connect(process.env.MONGODB_URI);
	console.log('Example app listening at http://localhost:%s', server.address().port);
});