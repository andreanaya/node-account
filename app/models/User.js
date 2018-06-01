const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Schema = mongoose.Schema;

var UserSchema = new Schema({
	username: {
		type: String,
		required: true,
		unique: true,
		trim: true
	},
	email: {
		type: String,
		required: true,
		unique: true,
		trim: true
	},
	hash: {
		type: String,
		required: true
	},
	salt: {
		type: String,
		required: true
	}
});

UserSchema.methods.setPassword = function(password){
	this.salt = crypto.randomBytes(16).toString('hex');
	this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
};

UserSchema.methods.validatePassword = function(password) {
	var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
	return this.hash === hash;
};

UserSchema.methods.generateToken = function() {
	var expiry = new Date();
	expiry.setDate(expiry.getDate() + 7);

	return jwt.sign({
		_id: this._id,
		email: this.email,
		username: this.username,
		exp: parseInt(expiry.getTime() / 1000),
  	}, process.env.TOKEN_SECRET);
};

module.exports = mongoose.model('User', UserSchema);