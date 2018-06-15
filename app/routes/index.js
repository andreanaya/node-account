const csrf = require('csurf');
const User = require('../controllers/User');
const Authentication = require('../controllers/Authentication');

const RateLimit = require('express-rate-limit');
const {strictRate, lowRate} = require('../utils/RateLimits');
const {notification, notificationParser} = require('../utils/QueryNotification');

let csrfProtection = csrf({ cookie: true });

let strictLimiter = new RateLimit(strictRate());
let lowRateLimiter = new RateLimit(lowRate());

module.exports = function(app) {
	app.route('/')
		.get((req, res) => {
			throw new Error('error')
			res.status(301)
			.redirect('/login');
		});

	app.use(notificationParser);

	app.route('/register')
		.get(User.view.register)
		.post(strictLimiter, User.create, User.view.registrationComplete);

	app.route('/confirm/:token')
		.get(Authentication.confirm, Authentication.view.emailConfirmation);

	app.route('/login')
		.get(Authentication.view.login)
		.post(lowRateLimiter, Authentication.authenticate, Authentication.view.logged, Authentication.view.error);

	app.route('/logout')
		.get(Authentication.view.logout);

	app.route('/resetpassword')
		.get(Authentication.view.resetPassword)
		.post(lowRateLimiter, Authentication.reset, Authentication.view.resetPasswordComplete, Authentication.view.error);

	app.route('/account')
		.get(Authentication.authorize, User.view.account, User.view.error);

	app.route('/update')
		.get(Authentication.authorize, User.view.update, User.view.error)
		.post(lowRateLimiter, Authentication.authorize, User.update, User.view.updateComplete, User.view.error);

	app.route('/delete')
		.post(lowRateLimiter, Authentication.authorize, User.delete, User.view.delete, User.view.error);

	//API ROUTES

	app.route('/api/register')
		.post(strictLimiter, User.create, User.api.register, User.api.error);

	app.route('/api/login')
		.post(lowRateLimiter, Authentication.authenticate, Authentication.api.login, Authentication.api.error);

	app.route('/api/resetpassword')
		.post(lowRateLimiter, Authentication.reset, Authentication.api.resetPassword, Authentication.api.error);

	app.route('/api/account')
		.get(Authentication.authorize, User.api.account, User.api.error)
		.put(Authentication.authorize, User.update, User.api.update, User.api.error)
		.delete(Authentication.authorize, User.delete, User.api.delete, User.api.error);

	app.use((req, res, next) => {
		res.status(404).redirect('/login?'+notification('alert', 'Page not found!'));
	});

	app.use((err, req, res, next) => {
		res.status(400).redirect('/login?'+notification('error', 'Server error!'));
	});
};