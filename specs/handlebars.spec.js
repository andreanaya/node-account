const chai = require('chai');
const expect = chai.expect;
const handlebars = require('handlebars');
const HBSHelpers = require('../app/utils/HBSHelpers.js');

module.exports = describe('Handlebars helpers tests ', () => {
	before((done) => {
		Object.keys(HBSHelpers).forEach(function(key) {
			handlebars.registerHelper(key, HBSHelpers[key]);
		});

		done();
	})

	it('should pass if if_eq does not match', (done) => {
		let html = handlebars.compile('{{#if_eq a b}}true{{else}}false{{/if_eq}}')({a: 0, b: 1});
		expect(html).to.be.equals('false');

		done();
	});

	it('should pass if if_eq match', (done) => {
		let html = handlebars.compile('{{#if_eq a b}}true{{else}}false{{/if_eq}}')({a: 1, b: 1});
		expect(html).to.be.equals('true');

		done();
	});

	it('should pass if if_not_eq does not match', (done) => {
		let html = handlebars.compile('{{#if_not_eq a b}}true{{else}}false{{/if_not_eq}}')({a: 1, b: 1});
		expect(html).to.be.equals('false');

		done();
	});

	it('should pass if if_not_eq match', (done) => {
		let html = handlebars.compile('{{#if_not_eq a b}}true{{else}}false{{/if_not_eq}}')({a: 0, b: 1});
		expect(html).to.be.equals('true');

		done();
	});

	it('should pass if if_lt does not match', (done) => {
		let html = handlebars.compile('{{#if_lt a b}}true{{else}}false{{/if_lt}}')({a: 1, b: 1});
		expect(html).to.be.equals('false');

		done();
	});

	it('should pass if if_lt match', (done) => {
		let html = handlebars.compile('{{#if_lt a b}}true{{else}}false{{/if_lt}}')({a: 0, b: 1});
		expect(html).to.be.equals('true');

		done();
	});

	it('should pass if if_lt_eq does not match', (done) => {
		let html = handlebars.compile('{{#if_lt_eq a b}}true{{else}}false{{/if_lt_eq}}')({a: 2, b: 1});
		expect(html).to.be.equals('false');

		done();
	});

	it('should pass if if_lt_eq match', (done) => {
		let html = handlebars.compile('{{#if_lt_eq a b}}true{{else}}false{{/if_lt_eq}}')({a: 1, b: 1});
		expect(html).to.be.equals('true');

		done();
	});

	it('should pass if if_gt does not match', (done) => {
		let html = handlebars.compile('{{#if_gt a b}}true{{else}}false{{/if_gt}}')({a: 1, b: 1});
		expect(html).to.be.equals('false');

		done();
	});

	it('should pass if if_gt match', (done) => {
		let html = handlebars.compile('{{#if_gt a b}}true{{else}}false{{/if_gt}}')({a: 1, b: 0});
		expect(html).to.be.equals('true');

		done();
	});

	it('should pass if if_gt_eq does not match', (done) => {
		let html = handlebars.compile('{{#if_gt_eq a b}}true{{else}}false{{/if_gt_eq}}')({a: 1, b: 2});
		expect(html).to.be.equals('false');

		done();
	});

	it('should pass if if_gt_eq match', (done) => {
		let html = handlebars.compile('{{#if_gt_eq a b}}true{{else}}false{{/if_gt_eq}}')({a: 1, b: 1});
		expect(html).to.be.equals('true');

		done();
	});

	it('should pass if contains does not match', (done) => {
		let html = handlebars.compile('{{#contains a b}}true{{else}}false{{/contains}}')({a: [0, 1, 2, 3], b: 4});
		expect(html).to.be.equals('false');

		done();
	});

	it('should pass if contains match', (done) => {
		let html = handlebars.compile('{{#contains a b}}true{{else}}false{{/contains}}')({a: [0, 1, 2, 3], b: 1});
		expect(html).to.be.equals('true');

		done();
	});

	it('should pass if none of the items match', (done) => {
		let html = handlebars.compile('{{#filter a b c}}true{{else}}false{{/filter}}')({
			a: {
				a: 8,
				b: 9,
				c: 10
			},
			b: {
				a:[0, 1, 2],
				b:[2, 3, 4],
				c:[5, 6, 7]
			},
			c: 'some'
		});
		expect(html).to.be.equals('false');

		done();
	});

	it('should pass if some items match', (done) => {
		let html = handlebars.compile('{{#filter a b c}}true{{else}}false{{/filter}}')({
			a: {
				a: 8,
				b: 4,
				c: 10
			},
			b: {
				a:[0, 1, 2],
				b:[2, 3, 4],
				c:[5, 6, 7]
			},
			c: 'some'
		});
		expect(html).to.be.equals('true');

		done();
	});

	it('should pass if any of the items does not match', (done) => {
		let html = handlebars.compile('{{#filter a b c}}true{{else}}false{{/filter}}')({
			a: {
				a: 2,
				b: 4,
				c: 8
			},
			b: {
				a:[0, 1, 2],
				b:[2, 3, 4],
				c:[5, 6, 7]
			},
			c: 'every'
		});
		expect(html).to.be.equals('false');

		done();
	});

	it('should pass if all items match', (done) => {
		let html = handlebars.compile('{{#filter a b c}}true{{else}}false{{/filter}}')({
			a: {
				a: 2,
				b: 4,
				c: 7
			},
			b: {
				a:[0, 1, 2],
				b:[2, 3, 4],
				c:[5, 6, 7]
			},
			c: 'every'
		});
		expect(html).to.be.equals('true');

		done();
	});

	it('should fail if filter is undefined', (done) => {
		let html = handlebars.compile('{{#filter a b c}}true{{else}}false{{/filter}}')({
			a: {
				a: 2,
				b: 4,
				c: 7
			},
			b: undefined,
			c: 'every'
		});
		expect(html).to.be.equals('true');

		done();
	});


	it('should pass if items are sorted ascending', (done) => {
		let html = handlebars.compile('{{#sort a b c}}{{name}}{{/sort}}')({
			a: [
				{
					name: 'a'
				},
				{
					name: 'c'
				},
				{
					name: 'b'
				}
			],
			b: 'name',
			c: 'false'
		});
		expect(html).to.be.equals('abc');

		done();
	});

	it('should pass if items are sorted descending', (done) => {
		let html = handlebars.compile('{{#sort a b c}}{{name}}{{/sort}}')({
			a: [
				{
					name: 'a'
				},
				{
					name: 'c'
				},
				{
					name: 'c'
				},
				{
					name: 'b'
				}
			],
			b: 'name',
			c: 'true'
		});
		expect(html).to.be.equals('ccba');

		done();
	});

	it('should fail if sort property is undefined', (done) => {
		let html = handlebars.compile('{{#sort a b c}}{{name}}{{/sort}}')({
			a: [
				{
					name: 'a'
				},
				{
					name: 'c'
				},
				{
					name: 'c'
				},
				{
					name: 'b'
				}
			],
			b: undefined,
			c: 'true'
		});

		expect(html).to.be.equals('accb');

		done();
	});

	it('should pass if loop is done', (done) => {
		let html = handlebars.compile('{{#for 1 5}}{{@index}}{{/for}}')();
		expect(html).to.be.equals('12345');

		done();
	});

	it('should pass if stringify json', (done) => {
		let data = {
			name: 'name',
			active: true,
			total: 10
		};

		let html = handlebars.compile('{{{json this}}}')(data);
		expect(html).to.be.equals(JSON.stringify(data));

		done();
	});

	it('should pass if remove quotes from json string parameters', (done) => {
		let data = {
			name: 'name',
			active: true,
			total: 10
		};

		let html = handlebars.compile('{{{json this true}}}')(data);
		expect(html).to.be.equals('{name:"name",active:true,total:10}');

		done();
	});

	it('should pass if render raw partial', (done) => {
		let partial = 'Hello {{name}}!';
		handlebars.registerPartial('test', partial);

		let html = handlebars.compile('{{partial \'test\'}}')();
		expect(html).to.be.equals(partial);

		done();
	});

	it('should pass if render object keys lengthl', (done) => {
		let data = {a: 0, b: 1, c: 2}

		let html = handlebars.compile('{{objectlength this}}')(data);
		expect(html).to.be.equals('3');

		done();
	});
});