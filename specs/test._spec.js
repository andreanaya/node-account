const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const chai = require('chai');
const expect = chai.expect;
const app = require('../app/index');
const supertest = require("supertest")(app);

const SampleModel = mongoose.model('Sample', new Schema({
	name: { type: String, required: true, unique: true }
}));

describe('Database Tests', () => {
	before(async () => {
		await mongoose.connect(process.env.MONGODB_URI);
	});

	describe('Test Database', () => {
		it('should be invalid if name is empty', (done) => {
			var model = new SampleModel();
	 
			model.validate((err) => {
				expect(err.errors.name).to.exist;
				done();
			});
		});

		it('should be invalid if name is in wrong format', (done) => {
			var model = SampleModel({_name: 'Jon'});

			model.validate((err) => {
				expect(err.errors.name).to.exist;
				done();
			});
		});

		it('should be valid if name is saved on database', (done) => {
			var model = SampleModel({name: 'Jon'});

			model.save((err) => {
				expect(err).to.not.exist;
				done();
			});
		});

		it('should be invalid if name is already saved on database', (done) => {
			var model = SampleModel({name: 'Jon'});

			model.save((err) => {
				expect(err).to.exist;
				done();
			});
		});

		it('should be valid names list has at least 1 result', (done) => {
			SampleModel.find().exec((err, names) => {
				expect(names.length).to.be.at.least(1);
				done();
			});
		});

		it('should be valid if name is listed', (done) => {
			SampleModel.find({name: 'Jon'}).exec((err, names) => {
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
		it('should return 404', (done) => {
			supertest
				.get("/")
				.expect(404)
				.end(done);
		});
	});

	after(function(done){
		mongoose.connection.db.dropDatabase(() => {
			mongoose.connection.close(done);
		});
	});
});