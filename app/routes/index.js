const csrf = require('csurf');
const User = require('../controllers/User');
const API = require('../controllers/API');
const Account = require('../controllers/Account');

const RateLimit = require('express-rate-limit');
const {strictRate, lowRate} = require('../utils/RateLimits');
const {notification, notificationParser} = require('../utils/QueryNotification');

let csrfProtection = csrf({ cookie: true });

let strictLimiter = new RateLimit(strictRate());
let lowRateLimiter = new RateLimit(lowRate());

module.exports = function(app) {
	app.use(notificationParser);

	app.route('/register')
		.get(Account.create.get)
		.post(strictLimiter, User.create, Account.create.post, Account.error);

	app.route('/confirm/:token')
		.get(User.confirm, Account.confirm.get, Account.error);

	app.route('/login')
		.get(Account.login.get)
		.post(lowRateLimiter, User.login, Account.login.post, Account.error);

	app.route('/logout')
		.get(Account.logout.get);

	app.route('/recover')
		.get(Account.recover.get)
		.post(lowRateLimiter, User.recover, Account.recover.post, Account.error);

	app.route('/account')
		.get(User.authorize, Account.account.get, Account.error);

	app.route('/update')
		.get(User.authorize, Account.update.get, Account.error)
		.post(lowRateLimiter, User.authorize, User.update, Account.update.post, Account.error);

	app.route('/delete')
		.post(lowRateLimiter, User.authorize, User.delete, Account.delete.post, Account.error);

	//API ROUTES

	app.route('/api/register')
		.post(strictLimiter, User.create, API.register, API.error);

	app.route('/api/login')
		.post(lowRateLimiter, User.login, API.login, API.error);

	app.route('/api/recover')
		.post(lowRateLimiter, User.recover, API.recover, API.error);

	app.route('/api/account')
		.get(User.authorize, API.account, API.error)
		.put(User.authorize, User.update, API.update, API.error)
		.delete(User.authorize, User.delete, API.delete, API.error);

	app.use((req, res, next) => {
		res.status(404).redirect('/login?'+notification('alert', 'Page not found!'));
	});

	app.use(Account.error);
};