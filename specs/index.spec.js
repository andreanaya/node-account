const {connect, close} = require('./utils');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app/index');
const supertest = require("supertest")(app);
const User = require('../app/models/User');

describe('API tests ', () => {
	before(connect);

	require('./user-registration.spec');
	require('./user-login.spec');
	require('./user-update.spec');
	require('./user-delete.spec');

	after(close);
});