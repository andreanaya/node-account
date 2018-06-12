const csrf = require('csurf');
const jwt = require('express-jwt');
const User = require('../controllers/User');
const RateLimit = require('express-rate-limit');
const {strictRate, lowRate} = require('../utils/RateLimits');

let csrfProtection = csrf({ cookie: true });

let auth = jwt({
	secret: process.env.TOKEN_SECRET,
	userProperty: 'payload'
});

let strictLimiter = new RateLimit(strictRate());
let lowRateLimiter = new RateLimit(lowRate());

module.exports = function(app) {
	app.route('/confirm/:token')
		.get(User.confirm.validation, User.confirm.handler);

	app.route('/api/register')
		.post(strictLimiter, User.register.validation, User.register.handler);

	app.route('/api/login')
		.post(lowRateLimiter, User.authenticate.validation, User.authenticate.handler);

	app.route('/api/resetpassword')
		.post(lowRateLimiter, User.reset.validation, User.reset.handler);

	app.route('/api/account')
		.get(auth, User.account.handler)
		.put(auth, User.update.validation, User.update.handler)
		.delete(auth, User.delete.handler);

	app.use(User.error);
};