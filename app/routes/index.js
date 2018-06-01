
let jwt = require('express-jwt');
let auth = jwt({
	secret: process.env.TOKEN_SECRET,
	userProperty: 'payload'
});

module.exports = function(app) {
	let User = require('../controllers/User');

	app.route('/api/register')
		.post(User.register.validation, User.register.handler);

	app.route('/api/login')
		.post(User.authenticate.validation, User.authenticate.handler);

	app.route('/api/account')
		.get(auth, User.account.handler);

	app.use(function (err, req, res, next) {
		if (err.name === 'UnauthorizedError') {
			res.status(401).json({
				success: false,
				info: { message: 'Unauthorized access' }
			});
		}
	});
};