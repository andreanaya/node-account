const {connect, close, FakeResponse, tempUser} = require('./utils');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app/index');
const supertest = require("supertest")(app);
const User = require('../app/models/User');
const UserController = require('../app/controllers/User');
const {strictRate, lowRate} = require('../app/utils/RateLimits');
const bcrypt = require('bcrypt');
const {generateToken} = require('../app/utils/Token');

module.exports = describe('API tests ', () => {
	describe('User Login tests ', () => {
		describe('Endpoint Tests', () => {
			it('should return 401 if unauthorized', async () => {
				let res = await supertest.post("/api/login").expect(401);
				
				expect(res.body.success).to.be.false;
				expect(res.body.info).to.exist;
			});

			it('should return 429 strict rate-limit', async () => {
				let res = new FakeResponse();

				process.env.NODE_ENV = 'prod';
				
				let options = strictRate();

				expect(options.max).to.be.equals(1);

				await options.handler({}, res);

				process.env.NODE_ENV = 'test';

				expect(res.statusCode).to.equal(429);
				expect(res.body.success).to.be.false;
				expect(res.body.error.message).to.be.equals('Too many requests, please try again later');
			});

			it('should return 429 low rate-limit', async () => {
				let res = new FakeResponse();

				process.env.NODE_ENV = 'prod';
				
				let options = lowRate();

				expect(options.max).to.be.equals(5);

				await options.handler({}, res);

				process.env.NODE_ENV = 'test';

				expect(res.statusCode).to.equal(429);
				expect(res.body.success).to.be.false;
				expect(res.body.error.message).to.be.equals('Too many requests, please try again later');
			});


			it('should return 401 if unauthorized', async () => {
				let res = await supertest.post("/api/login").expect(401);
				
				expect(res.body.success).to.be.false;
				expect(res.body.info).to.exist;
			});

			it('should return 401 if not confirmed', async () => {
				let res = await supertest.post("/api/login").send({
					username: 'testuser',
					password: 'P4ssw0rd!',
				}).expect(401);
				
				expect(res.body.success).to.be.false;
				expect(res.body.info.message).to.be.equal('User not confirmed');
			});

			it('should return 400 token malformed', async () => {
				res = await supertest.get("/confirm/0").expect(400);
				expect(res.text).to.be.equals('jwt malformed');
			});

			it('should return 400 if token invalid', async () => {
				let token = generateToken({
					_id: '5b1f13def178ac167cfb2ce5',
					email: 'test@andreanaya.com'
				});

				res = await supertest.get("/confirm/"+token).expect(400);
			});

			it('should return 200 if confirmed', async () => {
				let data = await User.findOne({email: 'test@andreanaya.com'});
				
				let token = generateToken({
					_id: data._id,
					email: 'test@andreanaya.com'
				})

				let res = await supertest.get("/confirm/"+token).expect(200);

				expect(res.text).to.be.equals('Email confirmed');
			});

			it('should return 400 if user is active', async () => {
				let data = await tempUser();
				
				let token = generateToken({
					_id: data._id,
					email: data.email
				})

				let res = await supertest.get("/confirm/"+token).expect(400);

				await data.remove();

				expect(res.text).to.be.equals('User active');
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
				.set('Authorization', 'Bearer ' + generateToken({
					email: 'test@andreanaya.com',
					username: 'testuser'
				})).expect(401);
				
				expect(res.body.success).to.be.false;
				expect(res.body.info.message).to.be.equal('Unauthorized access');
			});

			it('should return 200 if authorized', async () => {
				let data = await tempUser();

				let token = generateToken({
					_id: data._id,
					email: data.email,
					username: data.username
				});

				let res = await supertest.get("/api/account")
				.set('Authorization', 'Bearer ' + token).expect(200);
				
				await data.remove();
				
				expect(res.body.success).to.be.true;
				expect(res.body.data).to.exist;
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

				let res = await supertest.get("/api/account")
					.set('Authorization', 'Bearer ' + token).expect(400);
				
				await data.remove();
				
				expect(res.body.success).to.be.false;
				expect(res.body.info.message).to.be.equal('Token revoked');
			});

			it('should return 401 if reset password of unconfirmed user', async () => {
				let data = await tempUser(false);

				let token = generateToken({
					_id: data._id,
					email: data.email,
					username: data.username
				});

				let res = await supertest.post("/api/resetpassword").send({
					email: data.email
				})
				.set('Authorization', 'Bearer ' + token);
				
				await data.remove();
				
				expect(res.body.success).to.be.false;
				expect(res.body.info.message).to.be.equal('User not active');
			});

			it('should return 200 if reset password', async () => {
				let data = await tempUser();

				let token = generateToken({
					_id: data._id,
					email: data.email,
					username: data.username
				});

				let res = await supertest.post("/api/resetpassword").send({
					email: data.email
				})
				.set('Authorization', 'Bearer ' + token);
				
				await data.remove();
				
				expect(res.body.success).to.be.true;
				expect(res.body.message).to.be.equal('Password sent to email');
			});
		});
	});
});