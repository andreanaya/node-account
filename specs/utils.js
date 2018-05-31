const mongoose = require('mongoose');

exports.connect = async () => {
	await mongoose.connect(process.env.MONGODB_URI);
}

exports.close = (done) => {
	mongoose.connection.db.dropDatabase(() => {
		mongoose.connection.close(done);
	});
}