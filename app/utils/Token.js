const jwt = require('jsonwebtoken');

module.exports.generateToken = function (payload) {
	let expiry = new Date();
	expiry.setDate(expiry.getDate() + 7);

	let sig = { exp: parseInt(expiry.getTime() / 1000) };

	Object.keys(payload).forEach((key) => {
		sig[key] = payload[key];
	});

	return jwt.sign(sig, process.env.TOKEN_SECRET);
}

module.exports.verify = function(token) {
	return jwt.verify(token, process.env.TOKEN_SECRET);
}