const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const chai = require('chai');
const expect = chai.expect;
const dbTest = require('../app/config.js').dbTest;

const Name = mongoose.model('Name', new Schema({
	name: { type: String, required: true, unique: true }
}));

describe('Database Tests', () => {
	before((done) => {
		mongoose.connect(dbTest);
		const db = mongoose.connection;
		db.on('error', console.error.bind(console, 'connection error'));
		db.once('open', done);
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