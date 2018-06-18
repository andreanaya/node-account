const chai = require('chai');
const expect = chai.expect;
const app = require('../app/index');
const supertest = require('supertest')(app);
const signature = require('cookie-signature');
const {FakeResponse} = require('./utils');
const User = require('../app/models/User');
const jwt = require('jsonwebtoken');
const {generateToken} = require('../app/utils/Token');
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
	});

	describe('Rate limit', () => {
		it('should pass if low limit reached', async () => {
			process.env.NODE_ENV = 'prod';

			let res = new FakeResponse();

			lowRate().handler({}, res);

			expect(res.statusCode).to.be.equals(429);
			expect(res.body.error.message).to.be.equals('Too many requests, please try again later');
			
			process.env.NODE_ENV = 'dev';
		});
		
		it('should pass if strict limit reached', async () => {
			process.env.NODE_ENV = 'prod';

			let res = new FakeResponse();

			strictRate().handler({}, res);

			expect(res.statusCode).to.be.equals(429);
			expect(res.body.error.message).to.be.equals('Too many requests, please try again later');
			
			process.env.NODE_ENV = 'dev';
		});
	});

	describe('Query notification tests', () => {
		it('should pass if low limit reached', async () => {
			let res = new FakeResponse();

			notificationParser({
				query: {notification: 'invalidJSON'}
			}, res, () => {});

			expect(res.notification).to.not.exist;
		});
	});
});