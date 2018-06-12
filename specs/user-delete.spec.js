const {connect, close, FakeResponse, tempUser} = require('./utils');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app/index');
const supertest = require("supertest")(app);
const User = require('../app/models/User');
const UserController = require('../app/controllers/User');
const bcrypt = require('bcrypt');
const {generateToken} = require('../app/utils/Token');

module.exports = describe('API tests ', () => {
	describe('User Delete tests ', () => {
		describe('Endpoint Tests', () => {
			it('should return 401 if unauthorized', async () => {
				let res = await supertest.delete("/api/account").expect(401);
				
				expect(res.body.success).to.be.false;
				expect(res.body.info.message).to.be.equal('Unauthorized access');
			});

			it('should return 401 if payload doesn\'t have id', async () => {
				let username = 'tempuser';
				let email = 'tempuser@email.com';
				let password = 'P4ssw0rd!';

				let user = new User({
					username: username,
					password: 'password',
					email: email,
					active: true	
				});

				let data = await user.save();

				let token = generateToken({
					email: email,
					username: username
				});

				let res = await supertest.delete("/api/account")
				.set('Authorization', 'Bearer ' + token).expect(401);

				await data.remove();
				
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
				let username = 'tempuser';
				let email = 'tempuser@email.com';
				let password = 'P4ssw0rd!';

				let user = new User({
					username: username,
					password: password,
					email: email,
					active: true	
				});

				let data = await user.save();

				let token = generateToken({
					_id: data._id,
					email: data.email,
					username: data.username
				});

				let res = await supertest.delete("/api/account")
				.set('Authorization', 'Bearer ' + token).expect(200);

				expect(res.body.success).to.be.true;
				expect(res.body.data).to.deep.include({
					username: username
				});
			});

			it('should return 400 if token revoked', async () => {
				let data = await tempUser();

				let date = new Date();
				let iat = parseInt(date.getTime() / 1000) - 10;

				let token = generateToken({
					_id: data._id,
					email: data.email,
					username: data.username,
					iat: iat
				});

				let res = await supertest.delete("/api/account")
					.set('Authorization', 'Bearer ' + token).expect(400);
				
				await data.remove();
				
				expect(res.body.success).to.be.false;
				expect(res.body.error.message).to.be.equal('Token revoked');
			});
		});
	});
});