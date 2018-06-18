const mongoose = require('mongoose');
const User = require('../app/models/User');

exports.connect = async () => {
	await mongoose.connect(process.env.MONGODB_URI);
}

exports.close = async () => {
	await mongoose.connection.db.dropDatabase();
	await mongoose.connection.close();
}

exports.tempUser = (model) => {
	let username = model && model.username != undefined ? model.username : 'tempuser'+Date.now();
	let email = model && model.email != undefined ? model.email : username+'@email.com';
	let password = model && model.password != undefined ? model.password : 'P4ssw0rd!';
	let active = model && model.active != undefined ? model.active : true;
	
	let user = new User({
		username: username,
		password: password,
		email: email,
		active: active
	});

	return user.save();
}

// class FakeResponse {
// 	constructor() {
// 		this.statusCode = undefined;
// 		this.body = undefined;
// 	}

// 	status(code) {
// 		this.statusCode = code;
// 		return this;
// 	}

// 	json(json) {
// 		this.body = json;
// 		return this;
// 	}
// }

// exports.FakeResponse = FakeResponse;