const {connect, close} = require('./utils');

describe('API tests ', () => {
	before(connect);

	require('./api.spec');
	require('./account.spec');
	require('./extra.spec');
	require('./handlebars.spec');

	after(close);
});