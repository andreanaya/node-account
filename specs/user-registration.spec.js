const {clear} = require('./utils');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app/index');
const supertest = require("supertest")(app);
const User = require('../app/models/User');
const bcrypt = require('bcrypt');

module.exports = describe('API tests ', () => {
	describe('User Registration tests ', () => {
		describe('Model Validation', () => {
			it('should be invalid if is empty', (done) => {
				let model = new User();
				
				model.validate((err) => {
					expect(err).to.exist;
					done();
				});
			});

			it('should be invalid if password is blank', (done) => {
				let model = new User({
					username: 'testuser',
					email: 'test@andreanaya.com',
					password: ''
				});
				
				model.validate((err) => {
					expect(err).to.exist;
					done();
				});
			});

			it('should be valid if all fields are defined', (done) => {
				let model = new User({
					username: 'testuser',
					email: 'test@andreanaya.com',
					password: 'test'
				});

				model.validate((err) => {
					expect(err).to.not.exist;
					done();
				});
			});
		});

		describe('Endpoint Tests', () => {
			it('should return 400 if username is missing', async () => {
				let res = await supertest.post("/api/register").expect(400);

				expect(res.body.success).to.be.false;
				expect(res.body.errors).to.deep.include({
					field: 'username',
					message: 'missing'
				});
			});

			it('should return 400 if email is missing', async () => {
				let res = await supertest.post("/api/register").expect(400);

				expect(res.body.success).to.be.false;
				expect(res.body.errors).to.deep.include({
					field: 'email',
					message: 'missing'
				});
			});

			it('should return 400 if password is missing', async () => {
				let res = await supertest.post("/api/register").expect(400);
				
				expect(res.body.success).to.be.false;
				expect(res.body.errors).to.deep.include({
					field: 'password',
					message: 'missing'
				});
			});

			it('should return 400 if username is invalid', async () => {
				let res = await supertest.post("/api/register").send({username: '     '}).expect(400);

				expect(res.body.success).to.be.false;
				expect(res.body.errors).to.deep.include({
					field: 'username',
					message: 'invalid'
				});
			});

			it('should return 400 if email is invalid', async () => {
				let res = await supertest.post("/api/register").send({email: 'test@emailcom'}).expect(400);
				
				expect(res.body.success).to.be.false;
				expect(res.body.errors).to.deep.include({
					field: 'email',
					message: 'invalid'
				});
			});

			it('should return 400 if password is invalid', async () => {
				let res = await supertest.post("/api/register").send({password: 'P4ssw0rd'}).expect(400);

				expect(res.body.success).to.be.false;
				expect(res.body.errors).to.deep.include({
					field: 'password',
					message: 'invalid'
				});
			});

			it('should return 400 if password confirmation doesn\'t match', async () => {
				let res = await supertest.post("/api/register").send({
					password: 'P4ssw0rd!',
					passwordConfirmation: 'P4ssw0rd@'
				}).expect(400);
				
				expect(res.body.success).to.be.false;
				expect(res.body.errors).to.deep.include({
					field: 'passwordConfirmation',
					message: 'invalid'
				});
			});

			it('should return 200 if testuser is saved on database', async () => {
				let username = 'testuser';
				let email = 'test@andreanaya.com';
				let password = 'P4ssw0rd!';

				let res = await supertest.post("/api/register").send({
					username: username,
					email: email,
					password: password,
					passwordConfirmation: password
				}).expect(200);
				
				expect(res.body.success).to.be.true;
				expect(res.body.data).to.deep.include({
					username: username,
					email: email
				});
				expect(bcrypt.compareSync(password, res.body.data.password)).to.be.true;
			});

			it('should return 400 if testuser is already registered on database', async () => {
				let username = 'testuser';
				let email = 'test@andreanaya.com';
				let password = 'P4ssw0rd!';

				let res = await supertest.post("/api/register").send({
					username: username,
					email: email,
					password: password,
					passwordConfirmation: password
				}).expect(400);
				
				expect(res.body.success).to.be.false;
				expect(res.body.error.code).to.be.equals(11000);
			});
		});
	});
});