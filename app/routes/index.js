const csrf = require('csurf');
const jwt = require('express-jwt');
const Registration = require('../controllers/Registration');
const Confirmation = require('../controllers/Confirmation');
const Authentication = require('../controllers/Authentication');
const PasswordReset = require('../controllers/PasswordReset');
const Account = require('../controllers/Account');
const RateLimit = require('express-rate-limit');
const {strictRate, lowRate} = require('../utils/RateLimits');

let csrfProtection = csrf({ cookie: true });

let auth = [
	jwt({
		secret: process.env.TOKEN_SECRET,
		userProperty: 'payload',
		credentialsRequired: false,
		getToken: (req) => {
			if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
				return req.headers.authorization.split(' ')[1];
			} else if (req.signedCookies && req.signedCookies.token) {
				return req.signedCookies.token;
			}
			return null;
		}
	}),
	(err, req, res, next) => {
		if (err) {
			if(err.name === 'UnauthorizedError') {
				next({authentication: 'Invalid token'});
			}
		} else {
			if (!req.payload || !req.payload._id) {
				next({authentication: 'Unauthorized access'});
			} else {
				next();
			}
		}
	}
];

let strictLimiter = new RateLimit(strictRate());
let lowRateLimiter = new RateLimit(lowRate());

module.exports = function(app) {
	app.route('/')
		.get(auth, (req, res, next) => {
			if(true) {
				next({message: 'OOOPS!! An error hapened'});
			}
			else {
				res.status(200).send('WORKING!');
			}
		}, (err, req, res, next) => {
			res.status(400).send(err.message);
		});

	app.route('/register')
		.get(Registration.web.form)
		.post(strictLimiter, Registration.validate, Registration.register, Registration.web.complete, Registration.web.error);

	app.route('/confirm/:token')
		.get(Confirmation.validate, Confirmation.web.get, Confirmation.web.error);

	app.route('/login')
		.get(Authentication.web.get)
		.post(lowRateLimiter, Authentication.validate, Authentication.authenticate, Authentication.web.post, Authentication.web.error);

	app.route('/logout')
		.get(Authentication.logout.get);

	app.route('/resetpassword')
		.get(PasswordReset.web.get)
		.post(lowRateLimiter, PasswordReset.validate, PasswordReset.reset, PasswordReset.web.post, PasswordReset.web.error);

	app.route('/account')
		.get(auth, Account.user.get, Account.web.get, Account.web.error);

	app.route('/update')
		.get(auth, Account.user.get, Account.web.form, Account.web.error)
		.post(lowRateLimiter, auth, Account.validate, Account.user.get, Account.user.update, Account.web.post, Account.web.error);

	app.route('/delete')
		.post(lowRateLimiter, auth,  Account.user.get, Account.user.delete, Account.web.delete, Account.web.error);

	//API ROUTES

	app.route('/api/register')
		.post(strictLimiter, Registration.validate, Registration.register, Registration.api.post, Registration.api.error);

	app.route('/api/login')
		.post(lowRateLimiter, Authentication.validate, Authentication.authenticate, Authentication.api.post, Authentication.api.error);

	app.route('/api/resetpassword')
		.post(lowRateLimiter, PasswordReset.validate, PasswordReset.reset, PasswordReset.api.post, PasswordReset.api.error);

	app.route('/api/account')
		.get(auth, Account.user.get, Account.api.get, Account.api.error)
		.put(auth, Account.validate, Account.user.get, Account.user.update, Account.api.put, Account.api.error)
		.delete(auth, Account.user.get, Account.user.delete, Account.api.delete, Account.api.error);

	app.use((err, req, res, next) => {
		res.status(404);
	});
};