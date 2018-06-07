const {connect, close, FakeResponse} = require('./utils');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app/index');
const supertest = require("supertest")(app);
const User = require('../app/models/User');
const UserController = require('../app/controllers/User');
const bcrypt = require('bcrypt');

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

	describe('User Account tests ', () => {
		describe('Endpoint Tests', () => {
			it('should return 401 if unauthorized', async () => {
				let res = await supertest.get("/api/account").expect(401);
				
				expect(res.body.success).to.be.false;
				expect(res.body.info.message).to.be.equal('Unauthorized access');
			});

			it('should return 401 if payload doesn\'t have id', async () => {
				let expiry = new Date();
				expiry.setDate(expiry.getDate() + 7);

				let res = await supertest.get("/api/account")
				.set('Authorization', 'Bearer ' + require('jsonwebtoken').sign({
					email: 'test@email.com',
					username: 'testuser',
					exp: parseInt(expiry.getTime() / 1000),
				}, process.env.TOKEN_SECRET)).expect(401);
				
				expect(res.body.success).to.be.false;
				expect(res.body.info.message).to.be.equal('Unauthorized access');
			});

			it('should return 200 if authorized', async () => {
				let res = await supertest.post("/api/login").send({
					username: 'testuser',
					password: 'P4ssw0rd!',
				});

				res = await supertest.get("/api/account")
				.set('Authorization', 'Bearer ' + res.body.token).expect(200);
				
				expect(res.body.success).to.be.true;
				expect(res.body.data).to.exist;
			});
		});
	});

	describe('User Update tests ', () => {
		describe('Endpoint Tests', () => {
			it('should return 401 if unauthorized', async () => {
				let res = await supertest.put("/api/account").expect(401);
				
				expect(res.body.success).to.be.false;
				expect(res.body.info.message).to.be.equal('Unauthorized access');
			});

			it('should return 401 if payload doesn\'t have id', async () => {
				let expiry = new Date();
				expiry.setDate(expiry.getDate() + 7);

				let res = await supertest.put("/api/account")
				.set('Authorization', 'Bearer ' + require('jsonwebtoken').sign({
					email: 'test@email.com',
					username: 'testuser',
					exp: parseInt(expiry.getTime() / 1000),
				}, process.env.TOKEN_SECRET)).expect(401);
				
				expect(res.body.success).to.be.false;
				expect(res.body.info.message).to.be.equal('Unauthorized access');
			});

			it('should return 500 fails', async () => {
				let res = new FakeResponse();

				await UserController.error(new Error('Test error'), {}, res, () => {});
				
				expect(res.statusCode).to.equal(500);
				expect(res.body.success).to.be.false;
				expect(res.body.error).to.exist;
			});

			it('should return 400 if invalid field', async () => {
				let res = await supertest.post("/api/login").send({
					username: 'testuser',
					password: 'P4ssw0rd!'
				});

				res = await supertest.put("/api/account")
				.set('Authorization', 'Bearer ' + res.body.token).expect(400).send({
					username: '',
					email: 'usernamemail.com',
					password: 'asd',
					passwordConfirmation: 'sdf'
				});
				
				expect(res.body.success).to.be.false;
				expect(res.body.errors).to.deep.include({ field: 'username', message: 'invalid' });
				expect(res.body.errors).to.deep.include({ field: 'email', message: 'invalid' });
				expect(res.body.errors).to.deep.include({ field: 'password', message: 'invalid' });
				expect(res.body.errors).to.deep.include({ field: 'passwordConfirmation', message: 'invalid' });
			});

			it('should return 400 if not updated', async () => {
				let req = {
					payload: {
						_id: '0'
					},
					body: {
						username: 'username',
						email: 'username@mail.com'
					}
				};

				let res = new FakeResponse();

				await UserController.update.handler(req, res);
				
				expect(res.statusCode).to.equal(400);
				expect(res.body.success).to.be.false;
				expect(res.body.error).to.exist;
			});

			it('should return 200 if username and email updated', async () => {
				let username = 'testuser';
				let email = 'test@email.com';
				let password = 'P4ssw0rd!';

				let res = await supertest.post("/api/login").send({
					username: username,
					password: password
				});

				res = await supertest.put("/api/account")
				.set('Authorization', 'Bearer ' + res.body.token).expect(200).send({
					username: username,
					email: email
				});
				
				expect(res.body.success).to.be.true;
				expect(res.body.data).to.deep.include({
					username: username,
					email: email
				});
			});

			it('should return 200 if password updated', async () => {
				let username = 'testuser';
				let email = 'test@email.com';
				let password = 'P4ssw0rd!';

				let res = await supertest.post("/api/login").send({
					username: username,
					password: password
				});

				res = await supertest.put("/api/account")
				.set('Authorization', 'Bearer ' + res.body.token).expect(200).send({
					password: password,
					passwordConfirmation: password
				});
				
				expect(res.body.success).to.be.true;
				expect(bcrypt.compareSync(password, res.body.data.password)).to.be.true;
			});
		});
	});
});