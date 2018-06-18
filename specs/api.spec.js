const chai = require('chai');
const expect = chai.expect;
const app = require('../app/index');
const supertest = require("supertest")(app);
const {tempUser} = require('./utils');
const User = require('../app/models/User');
const jwt = require('jsonwebtoken');
const {generateToken} = require('../app/utils/Token');

module.exports = describe('API tests ', () => {
	describe('Register tests', () => {
		it('should fail if username, email and password are missing', async () => {
			let res = await supertest.post("/api/register").expect(400);
			
			expect(res.body.success).to.be.false;
			expect(res.body.error.type).to.be.equal('validation');
			expect(res.body.error.errors).to.include({
				username: 'missing',
				email: 'missing',
				password: 'missing'
			});
		});
		it('should fail if username is invalid', async () => {
			let res = await supertest.post("/api/register")
			.send({
				username: 'username!'
			}).expect(400);
			
			expect(res.body.success).to.be.false;
			expect(res.body.error.type).to.be.equal('validation');
			expect(res.body.error.errors).to.include({
				username: 'invalid'
			});
		});
		it('should fail if email is invalid', async () => {
			let res = await supertest.post("/api/register")
			.send({
				email: 'email'
			}).expect(400);
			
			expect(res.body.success).to.be.false;
			expect(res.body.error.type).to.be.equal('validation');
			expect(res.body.error.errors).to.include({
				email: 'invalid'
			});
		});
		it('should fail if password is invalid', async () => {
			let res = await supertest.post("/api/register")
			.send({
				password: 'password'
			}).expect(400);
			
			expect(res.body.success).to.be.false;
			expect(res.body.error.type).to.be.equal('validation');
			expect(res.body.error.errors).to.include({
				password: 'invalid'
			});
		});
		it('should fail if password confirmation is missing', async () => {
			let res = await supertest.post("/api/register")
			.send({
				password: 'P4ssw0rd!'
			}).expect(400);
			
			expect(res.body.success).to.be.false;
			expect(res.body.error.type).to.be.equal('validation');
			expect(res.body.error.errors).to.include({
				passwordConfirmation: 'missing'
			});
		});
		it('should fail if password confirmation is invalid', async () => {
			let res = await supertest.post("/api/register")
			.send({
				password: 'P4ssw0rd!',
				passwordConfirmation: 'P4ssw0rd'
			}).expect(400);
			
			expect(res.body.success).to.be.false;
			expect(res.body.error.type).to.be.equal('validation');
			expect(res.body.error.errors).to.include({
				passwordConfirmation: 'invalid'
			});
		});
		it('should fail if username is taken', async () => {
			let user = await tempUser({username: 'testuser'});

			let res = await supertest.post("/api/register")
			.send({
				username: 'testuser',
				email: 'test2@email.com',
				password: 'P4ssw0rd!',
				passwordConfirmation: 'P4ssw0rd!'
			}).expect(400);

			await user.remove();

			expect(res.body.success).to.be.false;
			expect(res.body.error.type).to.be.equal('server');
			expect(res.body.error.message).to.be.equals('Username testuser already exist.');
		});
		it('should fail if email is taken', async () => {
			let user = await tempUser({email: 'test@email.com'});

			let res = await supertest.post("/api/register")
			.send({
				username: 'testuser2',
				email: 'test@email.com',
				password: 'P4ssw0rd!',
				passwordConfirmation: 'P4ssw0rd!'
			}).expect(400);

			await user.remove();

			expect(res.body.success).to.be.false;
			expect(res.body.error.type).to.be.equal('server');
			expect(res.body.error.message).to.be.equals('Email test@email.com already exist.');
		});
		it('should pass if all fields are valid', async () => {
			let res = await supertest.post("/api/register")
			.send({
				username: 'testuser',
				email: 'test@email.com',
				password: 'P4ssw0rd!',
				passwordConfirmation: 'P4ssw0rd!'
			}).expect(200);

			let user = await User.findOne({username: 'testuser'});
			await user.remove();
			
			expect(res.body.success).to.be.true;
			expect(res.body.data).to.exist;
		});
	});

	describe('Login tests', () => {
		it('should fail username is invalid', async () => {
			let user = await tempUser({
				username: 'testuser',
				password: 'P4ssw0rd!'
			});

			let res = await supertest.post("/api/login")
			.send({
				password: 'P4ssw0rd!'
			}).expect(400);

			await user.remove();
			
			expect(res.body.success).to.be.false;
			expect(res.body.error.type).to.equals('authentication');
			expect(res.body.error.message).to.equals('Invalid username or password');
		});
		it('should fail password is invalid', async () => {
			let user = await tempUser({
				username: 'testuser',
				password: 'P4ssw0rd!'
			});

			let res = await supertest.post("/api/login")
			.send({
				username: 'testuser'
			}).expect(400);

			await user.remove();
			
			expect(res.body.success).to.be.false;
			expect(res.body.error.type).to.equals('authentication');
			expect(res.body.error.message).to.equals('Invalid username or password');
		});
		it('should fail email is not confirmed', async () => {
			let user = await tempUser({
				username: 'testuser',
				password: 'P4ssw0rd!',
				active: false
			});

			let res = await supertest.post("/api/login")
			.send({
				username: 'testuser',
				password: 'P4ssw0rd!'
			}).expect(400);

			await user.remove();
			
			expect(res.body.success).to.be.false;
			expect(res.body.error.type).to.equals('authentication');
			expect(res.body.error.message).to.equals('Email not confirmed');
		});
		it('should pass if login', async () => {
			let user = await tempUser({password: 'P4ssw0rd!'});

			let res = await supertest.post("/api/login")
			.send({
				username: user.username,
				password: 'P4ssw0rd!'
			}).expect(200);

			await user.remove();
			
			expect(res.body.success).to.be.true;
			expect(res.body.token).to.exist;
		});
	});

	describe('Account tests', () => {
		it('should fail if not authenticated', async () => {
			let res = await supertest.get("/api/account").expect(400);

			expect(res.body.success).to.be.false;
			expect(res.body.error.type).to.equals('authentication');
			expect(res.body.error.message).to.equals('Unauthorized access');
		});
		
		it('should fail if invalid token', async () => {
			let res = await supertest.get("/api/account").set('Authorization', 'Bearer invalid').expect(400);
			
			expect(res.body.success).to.be.false;
			expect(res.body.error.type).to.equals('authentication');
			expect(res.body.error.message).to.equals('Invalid token');
		});
		
		it('should fail if token payload invalid', async () => {
			let user = await tempUser();

			let token = generateToken({
				email: user.email,
				username: user.username
			});
			
			let res = await supertest.get("/api/account").set('Authorization', 'Bearer '+token).expect(400);

			await user.remove();
			
			expect(res.body.success).to.be.false;
			expect(res.body.error.type).to.equals('authentication');
			expect(res.body.error.message).to.equals('Unauthorized access');
		});
		
		it('should fail if id invalid', async () => {
			let user = await tempUser();

			let token = generateToken({
				_id: '0',
				email: user.email,
				username: user.username
			});
			
			let res = await supertest.get("/api/account").set('Authorization', 'Bearer '+token).expect(400);

			await user.remove();
			
			expect(res.body.success).to.be.false;
			expect(res.body.error.type).to.equals('server');
			expect(res.body.error.message).to.equals('Server error');
		});
		
		it('should fail if token id not found', async () => {
			let user = await tempUser();

			let token = generateToken({
				_id: '5b1f13def178ac167cfb2ce5',
				email: user.email,
				username: user.username
			});
			
			let res = await supertest.get("/api/account").set('Authorization', 'Bearer '+token).expect(400);

			await user.remove();
			
			expect(res.body.success).to.be.false;
			expect(res.body.error.type).to.equals('server');
			expect(res.body.error.message).to.equals('User not found');
		});
		
		it('should fail if token revoked', async () => {
			let user = await tempUser();

			let token = generateToken({
				_id: user._id,
				email: user.email,
				username: user.username,
				iat: 1
			});
			
			let res = await supertest.get("/api/account").set('Authorization', 'Bearer '+token).expect(400);

			await user.remove();
			
			expect(res.body.success).to.be.false;
			expect(res.body.error.type).to.equals('authentication');
			expect(res.body.error.message).to.equals('Token revoked');
		});
	});
});