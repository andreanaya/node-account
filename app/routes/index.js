const csrf = require('csurf');
const User = require('../controllers/User');
const Authentication = require('../controllers/Authentication');

const Login = require('../controllers/Login');
const Registration = require('../controllers/Registration');
const Confirmation = require('../controllers/Confirmation');
const PasswordReset = require('../controllers/PasswordReset');
const Account = require('../controllers/Account');
const RateLimit = require('express-rate-limit');
const {strictRate, lowRate} = require('../utils/RateLimits');

let csrfProtection = csrf({ cookie: true });

let strictLimiter = new RateLimit(strictRate());
let lowRateLimiter = new RateLimit(lowRate());

module.exports = function(app) {
	// app.route('/')
	// 	.get(auth, (req, res, next) => {
	// 		if(true) {
	// 			next({message: 'OOOPS!! An error hapened'});
	// 		}
	// 		else {
	// 			res.status(200).send('WORKING!');
	// 		}
	// 	}, (err, req, res, next) => {
	// 		res.status(400).send(err.message);
	// 	});

	app.route('/register')
		.get(Registration.web.form)
		.post(strictLimiter, User.create, Registration.web.complete, Registration.web.error);

	app.route('/confirm/:token')
		.get(Confirmation.validate, Confirmation.web.get, Confirmation.web.error);

	app.route('/login')
		.get(Login.web.get)
		.post(lowRateLimiter, Authentication.authenticate, Login.web.post, Login.web.error);

	app.route('/logout')
		.get(Login.logout.get);

	app.route('/resetpassword')
		.get(PasswordReset.web.get)
		.post(lowRateLimiter, Authentication.reset, PasswordReset.web.post, PasswordReset.web.error);

	app.route('/account')
		.get(Authentication.authorize, Account.web.get, Account.web.error);

	app.route('/update')
		.get(Authentication.authorize, Account.web.form, Account.web.error)
		.post(lowRateLimiter, Authentication.authorize, User.update, Account.web.post, Account.web.error);

	app.route('/delete')
		.post(lowRateLimiter, Authentication.authorize, User.delete, Account.web.delete, Account.web.error);

	//API ROUTES

	app.route('/api/register')
		.post(strictLimiter, User.create, Registration.api.post, Registration.api.error);

	app.route('/api/login')
		.post(lowRateLimiter, Authentication.authenticate, Login.api.post, Login.api.error);

	app.route('/api/resetpassword')
		.post(lowRateLimiter, Authentication.reset, PasswordReset.api.post, PasswordReset.api.error);

	app.route('/api/account')
		.get(Authentication.authorize, Account.api.get, Account.api.error)
		.put(Authentication.authorize, User.update, Account.api.put, Account.api.error)
		.delete(Authentication.authorize, User.delete, Account.api.delete, Account.api.error);

	app.use((err, req, res, next) => {
		res.status(404);
	});
};