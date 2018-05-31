const chai = require('chai');
const expect = chai.expect;
const app = require('../../app/index');
const supertest = require("supertest")(app);

describe('User endpoint tests ', () => {
	describe('Test route /api/register', () => {
		it('should post and return json with status 200 or 400', (done) => {
			supertest
				.post("/api/register")
				.end((err, res) => {
					expect(res.status).to.be.oneOf([200, 400])
					done();
				});
		});

		it('should return 200 if fields are valid', (done) => {
			supertest
				.post("/api/register")
				.send({
					username: 'testuser',
					email: 'test@email.com',
					password: 'P4ssw0rd!',
					passwordConfirmation: 'P4ssw0rd!'
				})
				.end((err, res) => {
					expect(res.status).to.be.equals(200);
					expect(res.body.success).to.be.true;
					expect(res.body.errors).to.not.exist;

					done();
				});
		});

		it('should return 400 if username is missing', (done) => {
			supertest
				.post("/api/register")
				.expect(400)
				.end((err, res) => {
					expect(res.body.success).to.be.false;
					expect(res.body.errors).to.deep.include({
						field: 'username',
						message: 'missing'
					});
					done();
				});
		});

		it('should return 400 if email is missing', (done) => {
			supertest
				.post("/api/register")
				.expect(400)
				.end((err, res) => {
					expect(res.body.success).to.be.false;
					expect(res.body.errors).to.deep.include({
						field: 'email',
						message: 'missing'
					});

					done();
				});
		});

		it('should return 400 if password is missing', (done) => {
			supertest
				.post("/api/register")
				.expect(400)
				.end((err, res) => {
					expect(res.body.success).to.be.false;
					expect(res.body.errors).to.deep.include({
						field: 'password',
						message: 'missing'
					});

					done();
				});
		});

		it('should return 400 if username is invalid', (done) => {
			supertest
				.post("/api/register")
				.send({
					username: '     '
				})
				.expect(400)
				.end((err, res) => {
					expect(res.body.success).to.be.false;
					expect(res.body.errors).to.deep.include({
						field: 'username',
						message: 'invalid'
					});
					done();
				});
		});

		it('should return 400 if email is invalid', (done) => {
			supertest
				.post("/api/register")
				.send({
					email: 'test@emailcom'
				})
				.expect(400)
				.end((err, res) => {
					expect(res.body.success).to.be.false;
					expect(res.body.errors).to.deep.include({
						field: 'email',
						message: 'invalid'
					});
					done();
				});
		});

		it('should return 400 if password is invalid', (done) => {
			supertest
				.post("/api/register")
				.send({
					password: 'P4ssw0rd'
				})
				.expect(400)
				.end((err, res) => {
					expect(res.body.success).to.be.false;
					expect(res.body.errors).to.deep.include({
						field: 'password',
						message: 'invalid'
					});
					done();
				});
		});

		it('should return 400 if password confirmation doesn\'t match', (done) => {
			supertest
				.post("/api/register")
				.send({
					password: 'P4ssw0rd!',
					passwordConfirmation: 'P4ssw0rd@'
				})
				.expect(400)
				.end((err, res) => {
					expect(res.body.success).to.be.false;
					expect(res.body.errors).to.deep.include({
						field: 'passwordConfirmation',
						message: 'invalid'
					});
					done();
				});
		});
	});
});