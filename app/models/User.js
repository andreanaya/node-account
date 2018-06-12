const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/Token');
const Schema = mongoose.Schema;

const SALT_FACTOR = 10;

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
	password: {
		type: String,
		required: true
	},
	active: {
		type: Boolean,
		default: false
	},
	created: {
		type: Number
	}
});

UserSchema.pre('save', async function() {
	if (this.isModified('password')) {
		let hash = await bcrypt.hash(this.password, SALT_FACTOR);
		this.password = hash;
		this.created = parseInt(new Date().getTime() / 1000);
	}
});

UserSchema.methods.validatePassword = function(password) {
	return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);