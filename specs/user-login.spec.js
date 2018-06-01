const {connect, close} = require('./utils');
const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const app = require('../app/index');
const supertest = require("supertest")(app);
const User = require('../app/models/User');

module.exports = describe('API tests ', () => {
	describe('User Login tests ', () => {
		describe('Endpoint Tests', () => {
			it('should return 401 if unauthorized', async () => {
				let res = await supertest.post("/api/login").expect(401);
				
				expect(res.body.success).to.be.false;
				expect(res.body.info).to.exist;
			});

			it('should return 401 if unauthorized', async () => {
				let res = await supertest.post("/api/login").expect(401);
				
				expect(res.body.success).to.be.false;
				expect(res.body.info).to.exist;
			});

			it('should return 200 if user authorized', async () => {
				let res = await supertest.post("/api/login").send({
					username: 'testuser',
					password: 'P4ssw0rd!',
				}).expect(200);
				
				expect(res.body.success).to.be.true;
				expect(res.body.token).to.exist;
			});

			it('should return 401 if user is not registered', async () => {
				let res = await supertest.post("/api/login").send({
					username: 'testuser__',
					password: 'P4ssw0rd!',
				}).expect(401);

				expect(res.body.success).to.be.false;
				expect(res.body.info.message).to.be.equal('User not found');
			});

			it('should return 401 if user is not registered', async () => {
				let res = await supertest.post("/api/login").send({
					username: 'testuser',
					password: 'P4ssw0rd?',
				}).expect(401);

				expect(res.body.success).to.be.false;
				expect(res.body.info.message).to.be.equal('Incorrect password');
			});
		});
	});
});