const {connect, close} = require('./utils');

describe('API tests ', () => {
	before(connect);

	require('./api.spec');
	// require('./user-registration.spec');
	// require('./user-login.spec');
	// require('./user-update.spec');
	// require('./user-delete.spec');

	after(close);
});