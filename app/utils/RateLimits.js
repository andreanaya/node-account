module.exports.strictRate = function() {
	return {
		windowMs: 60*1000,
		max: process.env.NODE_ENV === 'prod' ? 1 : 0,
		delayMs: 0,
		handler: function (req, res) {
			res.status(429).json({ success: false, error: {message: 'Too many requests, please try again later'} });
		}
	}
}

module.exports.lowRate = function() {
	return {
		windowMs: 30*1000,
		max: process.env.NODE_ENV === 'prod' ? 5 : 0,
		delayMs: 0,
		handler: function (req, res) {
			res.status(429).json({ success: false, error: {message: 'Too many requests, please try again later'} });
		}
	}
}