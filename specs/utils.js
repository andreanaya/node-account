const mongoose = require('mongoose');
const User = require('../app/models/User');

exports.connect = async () => {
	await mongoose.connect(process.env.MONGODB_URI);
}

exports.close = async () => {
	await mongoose.connection.db.dropDatabase();
	await mongoose.connection.close();
}

exports.tempUser = (active) => {
	let username = 'tempuser'+Date.now();
	let email = username+'@email.com';
	let password = 'P4ssw0rd!';

	let user = new User({
		username: username,
		password: password,
		email: email,
		active: active != undefined ? active : true
	});

	return user.save();
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