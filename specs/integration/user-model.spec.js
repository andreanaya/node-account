const {connect, close} = require('../utils');
const chai = require('chai');
const expect = chai.expect;

const User = require('../../app/models/User');

describe('User Model Tests', () => {
	before(connect);

	describe('Validation', () => {
		it('should be invalid if is empty', (done) => {
			let model = new User();
	 
			model.validate((err) => {
				expect(err).to.exist;
				done();
			});
		});

		it('should be valid if username and email exist', (done) => {
			let model = new User({
				username: 'testuser',
				email: 'test@email.com'
			});
	 
			model.validate((err) => {
				expect(err.errors.username).to.not.exist;
				expect(err.errors.email).to.not.exist;
				done();
			});
		});

		it('should be invalid if hash and salt are not defined', (done) => {
			let model = new User();
	 
			model.validate((err) => {
				expect(err.errors.hash).to.exist;
				expect(err.errors.salt).to.exist;
				done();
			});
		});

		it('should be valid if hash and salt are defined', (done) => {
			let model = new User();

			model.setPassword('P4ssw0rd!');
	 
			model.validate((err) => {
				expect(err.errors.hash).to.not.exist;
				expect(err.errors.salt).to.not.exist;
				done();
			});
		});

		it('should be valid if all fields are valid', (done) => {
			let model = new User({
				username: 'testuser',
				email: 'test@email.com'
			});

			model.setPassword('P4ssw0rd!');
	 
			model.validate((err) => {
				expect(err).to.not.exist;
				done();
			});
		});
	});

	describe('Database', () => {
		it('should be valid if testuser is saved on database', (done) => {
			let model = new User({
				username: 'testuser',
				email: 'test@email.com'
			});

			model.setPassword('P4ssw0rd!');
	 
			model.save((err) => {
				expect(err).to.not.exist;
				done();
			});
		});

		it('should be invalid if testuser is already saved on database', (done) => {
			let model = new User({
				username: 'testuser',
				email: 'test@email.com'
			});

			model.setPassword('P4ssw0rd!');

			model.save((err) => {
				expect(err.code).to.be.equal(11000);
				done();
			});
		});
	});

	after(close);
});