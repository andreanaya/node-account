const {connect, close, FakeResponse} = require('./utils');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app/index');
const supertest = require("supertest")(app);
const User = require('../app/models/User');
const UserController = require('../app/controllers/User');
const bcrypt = require('bcrypt');

module.exports = describe('API tests ', () => {
	describe('User Delete tests ', () => {
		describe('Endpoint Tests', () => {
			it('should return 401 if unauthorized', async () => {
				let res = await supertest.delete("/api/account").expect(401);
				
				expect(res.body.success).to.be.false;
				expect(res.body.info.message).to.be.equal('Unauthorized access');
			});

			it('should return 401 if payload doesn\'t have id', async () => {
				let expiry = new Date();
				expiry.setDate(expiry.getDate() + 7);

				let res = await supertest.delete("/api/account")
				.set('Authorization', 'Bearer ' + require('jsonwebtoken').sign({
					email: 'test@email.com',
					username: 'testuser',
					exp: parseInt(expiry.getTime() / 1000),
				}, process.env.TOKEN_SECRET)).expect(401);
				
				expect(res.body.success).to.be.false;
				expect(res.body.info.message).to.be.equal('Unauthorized access');
			});

			it('should return 400 if not remove', async () => {
				let req = {
					payload: {
						_id: '0'
					}
				};

				let res = new FakeResponse();

				await UserController.delete.handler(req, res);
				
				expect(res.statusCode).to.equal(400);
				expect(res.body.success).to.be.false;
				expect(res.body.error).to.exist;
			});

			it('should return 200 user removed', async () => {
				let username = 'testuser';
				let password = 'P4ssw0rd!';

				let res = await supertest.post("/api/login").send({
					username: username,
					password: password
				});

				res = await supertest.delete("/api/account")
				.set('Authorization', 'Bearer ' + res.body.token).expect(200);

				console.log(res.body);
				
				expect(res.body.success).to.be.true;
				expect(res.body.data).to.deep.include({
					username: username
				});
			});
		});
	});
});