const chai = require('chai');
const expect = chai.expect;
const app = require('../app/index');
const supertest = require("supertest")(app);
const {FakeResponse} = require('./utils');
const User = require('../app/controllers/User');
const Account = require('../app/controllers/Account');
const {notification, notificationParser} = require('../app/utils/QueryNotification');
const {strictRate, lowRate} = require('../app/utils/RateLimits');

module.exports = describe('Extra modules tests ', () => {
	describe('Error pages', () => {
		it('should pass if 404 page exist', async () => {
			let res = await supertest.get("/404-page").expect(302);

			expect(res.headers.location).to.be.equals('/login?'+notification('alert', 'Page not found!'));
		});
		
		it('should pass if 404 page redirects to login', async () => {
			let res = await supertest.get("/404-page").redirects(1).expect(200);
		});

		it('should pass if 400 page redirects to login', (done) => {
			let res = new FakeResponse();

			Account.error({}, {}, res);

			expect(res.statusCode).to.be.equals(302);
			expect(res.headers.location).to.be.equals('/login?'+notification('error', 'Internal error'));

			done();
		});

		it('should pass if create generic error', (done) => {
			let res = new FakeResponse();

			Account.create.post[1]({}, {
				body: {
					username: 'username',
					email: 'email'
				}
			}, res);

			expect(res.statusCode).to.be.equals(400);
			expect(res.template).to.be.equals('base.hbs');
			expect(res.options).to.deep.nested.include({
				'model.notification': {
					type: 'server',
					message: 'Server error'
				}
			});


			done();
		});

		it('should pass if recover generic error', (done) => {
			let res = new FakeResponse();

			Account.recover.post[1]({}, {
				body: {
					username: 'username',
					email: 'email'
				}
			}, res);

			expect(res.statusCode).to.be.equals(400);
			expect(res.template).to.be.equals('base.hbs');
			expect(res.options).to.deep.nested.include({
				'model.notification': {
					type: 'server',
					message: 'Server error'
				}
			});

			done();
		});

		it('should pass if update server error', (done) => {
			let res = new FakeResponse();

			Account.update.post[1]({
				type: 'server',
				message: 'Test error'
			}, {
				body: {
					username: 'username',
					email: 'email'
				}
			}, res);

			expect(res.statusCode).to.be.equals(400);
			expect(res.template).to.be.equals('base.hbs');
			expect(res.options.model.data.errors).to.include({server: 'Test error'});

			done()
		});

		it('should pass if update generic error', (done) => {
			let res = new FakeResponse();

			Account.update.post[1]({}, {
				body: {
					username: 'username',
					email: 'email'
				}
			}, res);

			expect(res.statusCode).to.be.equals(400);
			expect(res.template).to.be.equals('base.hbs');
			expect(res.options).to.deep.nested.include({
				'model.notification': {
					type: 'server',
					message: 'Server error'
				}
			})

			done();
		});

		it('should pass if authorize generic error', (done) => {
			let res = new FakeResponse();

			User.authorize[1]({
				type: 'server',
				message: 'Test error'
			}, {}, res, (err) => {
				expect(err).to.include({
					type: 'server',
					message: 'Test error'
				});

				done();
			});
		});

		it('should pass if create generic error', (done) => {
			let res = new FakeResponse();

			User.create[1]({}, res, (err) => {
				expect(err).to.include({
					type: 'server',
					message: 'Server error'
				});

				done();
			});
		});

		it('should pass if confirm generic error', (done) => {
			let res = new FakeResponse();

			User.confirm[0]({}, res, (err) => {
				expect(err).to.include({
					type: 'server',
					message: 'Server error'
				});

				done();
			});
		});

		it('should pass if update generic error', (done) => {
			let res = new FakeResponse();

			User.update[1]({}, res, (err) => {
				expect(err).to.include({
					type: 'server',
					message: 'Server error'
				});

				done();
			});
		});

		it('should pass if delete generic error', (done) => {
			let res = new FakeResponse();

			User.delete({}, res, (err) => {
				expect(err).to.include({
					type: 'server',
					message: 'Server error'
				});

				done();
			});
		});
	});

	describe('Rate limit', () => {
		it('should pass if low limit reached', (done) => {
			process.env.NODE_ENV = 'prod';

			let res = new FakeResponse();

			lowRate().handler({}, res);

			expect(res.statusCode).to.be.equals(429);
			expect(res.body.error.message).to.be.equals('Too many requests, please try again later');
			
			process.env.NODE_ENV = 'dev';

			done()
		});
		
		it('should pass if strict limit reached', (done) => {
			process.env.NODE_ENV = 'prod';

			let res = new FakeResponse();

			strictRate().handler({}, res);

			expect(res.statusCode).to.be.equals(429);
			expect(res.body.error.message).to.be.equals('Too many requests, please try again later');
			
			process.env.NODE_ENV = 'dev';

			done()
		});
	});

	describe('Query notification tests', () => {
		it('should pass if low limit reached', (done) => {
			let res = new FakeResponse();

			notificationParser({
				query: {notification: 'invalidJSON'}
			}, res, () => {
				expect(res.notification).to.not.exist;
				done();
			});

		});
	});
});