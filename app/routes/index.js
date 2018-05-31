let User = require('../controllers/User');

module.exports = function(app) {
	app.route('/api/register')
		.post(User.register.validation, User.register.handler);
};