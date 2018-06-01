const mongoose = require('mongoose');

exports.connect = async () => {
	await mongoose.connect(process.env.MONGODB_URI);
}

exports.close = async () => {
	await mongoose.connection.db.dropDatabase();
	await mongoose.connection.close();
}