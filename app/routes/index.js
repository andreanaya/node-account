const csrf = require('csurf');
const jwt = require('express-jwt');
const User = require('../controllers/User');
const RateLimit = require('express-rate-limit');
const {strictRate, lowRate} = require('../utils/RateLimits');

let csrfProtection = csrf({ cookie: true });

let auth = jwt({
	secret: process.env.TOKEN_SECRET,
	userProperty: 'payload',
	credentialsRequired: false,
	getToken: function fromHeaderOrQuerystring (req) {
		if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
			return req.headers.authorization.split(' ')[1];
		} else if (req.signedCookies && req.signedCookies.token) {
			return req.signedCookies.token;
		}
		return null;
	}
});

let strictLimiter = new RateLimit(strictRate());
let lowRateLimiter = new RateLimit(lowRate());

module.exports = function(app) {
	// app.use('/', (req, res) => {
	// 	res.render('WORKING!')
	// })

	app.route('/register')
		.get(User.register.webGET)
		.post(strictLimiter, User.register.validation, User.register.webPOST);

	app.route('/confirm/:token')
		.get(User.confirm.validation, User.confirm.webGET);


	app.route('/login')
		.get(lowRateLimiter, User.authenticate.validation, User.authenticate.webGET)
		.post(lowRateLimiter, User.authenticate.validation, User.authenticate.webPOST);


	app.route('/account')
		.get(auth, User.account.webGET);


	app.route('/logout')
		.get(User.logout.webGET);


	app.route('/update')
		.get(auth, User.update.webGET)
		.post(lowRateLimiter, auth, User.update.validation, User.update.webPOST)


	app.route('/resetpassword')
		.get(User.reset.webGET)
		.post(lowRateLimiter, User.reset.validation, User.reset.webPOST);


	app.route('/delete')
		.post(lowRateLimiter, auth, User.delete.webPOST);

	//API ROUTES

	app.route('/api/register')
		.post(strictLimiter, User.register.validation, User.register.api);

	app.route('/api/login')
		.post(lowRateLimiter, User.authenticate.validation, User.authenticate.api);

	app.route('/api/resetpassword')
		.post(lowRateLimiter, User.reset.validation, User.reset.api);

	app.route('/api/account')
		.get(auth, User.account.api)
		.put(auth, User.update.validation, User.update.api)
		.delete(auth, User.delete.api);

	app.use(User.error);
};