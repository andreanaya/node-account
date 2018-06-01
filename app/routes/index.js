let User = require('../controllers/User');

module.exports = function(app) {
	app.route('/api/register')
		.post(User.register.validation, User.register.handler);

	app.route('/api/login')
		.post(User.authenticate.validation, User.authenticate.handler);
};