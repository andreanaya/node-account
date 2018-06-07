const User = require('../controllers/User');

const jwt = require('express-jwt');
let auth = jwt({
	secret: process.env.TOKEN_SECRET,
	userProperty: 'payload'
});

module.exports = function(app) {
	app.route('/api/register')
		.post(User.register.validation, User.register.handler);

	app.route('/api/login')
		.post(User.authenticate.validation, User.authenticate.handler);

	app.route('/api/account')
		.get(auth, User.account.handler)
		.put(auth, User.update.validation, User.update.handler);

	app.use(User.error);
};