const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const chai = require('chai');
const expect = chai.expect;
const app = require('../app/index');
const supertest = require("supertest")(app);

const Name = mongoose.model('Name', new Schema({
	name: { type: String, required: true, unique: true }
}));

describe('Database Tests', () => {
	before(async () => {
		await mongoose.connect(process.env.MONGODB_URI);
	});

	describe('Test Database', () => {
		it('should be invalid if name is empty', (done) => {
			var model = new Name();
	 
			model.validate((err) => {
				expect(err.errors.name).to.exist;
				done();
			});
		});

		it('should be invalid if name is in wrong format', (done) => {
			var model = Name({_name: 'Jon'});

			model.validate((err) => {
				expect(err.errors.name).to.exist;
				done();
			});
		});

		it('should be valid if name is saved on database', (done) => {
			var model = Name({name: 'Jon'});

			model.save((err) => {
				expect(err).to.not.exist;
				done();
			});
		});

		it('should be invalid if name is already saved on database', (done) => {
			var model = Name({name: 'Jon'});

			model.save((err) => {
				expect(err).to.exist;
				done();
			});
		});

		it('should be valid names list has at least 1 result', (done) => {
			Name.find().exec((err, names) => {
				expect(names.length).to.be.at.least(1);
				done();
			});
		});

		it('should be valid if name is listed', (done) => {
			Name.find({name: 'Jon'}).exec((err, names) => {
				expect(names[0].name).to.equal('Jon');
				done();
			});
		});
	});

	after(function(done){
		mongoose.connection.db.dropDatabase(() => {
			mongoose.connection.close(done);
		});
	});
});

describe('Integration Tests', () => {
	before(async () => {
		await mongoose.connect(process.env.MONGODB_URI);
	});

	describe('Test Server', () => {
		it('should return "Hello world!"', (done) => {
			supertest
				.get("/")
				.expect(200)
				.expect("Hello world!")
				.end(done);
		});
	});

	after(function(done){
		mongoose.connection.db.dropDatabase(() => {
			mongoose.connection.close(done);
		});
	});
});