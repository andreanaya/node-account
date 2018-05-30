module.exports = {
	test: {
		db: 'mongodb://localhost/test-node-account'
	},
	dev: {
		db: process.env.MONGODB_URI
	}
}