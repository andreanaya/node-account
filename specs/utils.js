const mongoose = require('mongoose');

exports.connect = async () => {
	await mongoose.connect(process.env.MONGODB_URI);
}

exports.close = async () => {
	await mongoose.connection.db.dropDatabase();
	await mongoose.connection.close();
}

class FakeResponse {
	constructor() {
		this.statusCode = undefined;
		this.body = undefined;
	}

	status(code) {
		this.statusCode = code;
		return this;
	}

	json(json) {
		this.body = json;
		return this;
	}
}

exports.FakeResponse = FakeResponse;