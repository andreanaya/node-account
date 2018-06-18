const chai = require('chai');
const expect = chai.expect;
const app = require('../app/index');
const supertest = require("supertest")(app);
const {tempUser} = require('./utils');
const User = require('../app/models/User');
const jwt = require('jsonwebtoken');
const {generateToken} = require('../app/utils/Token');

module.exports = describe('Account views tests ', () => {
	describe('Registration tests', () => {
		it('should pass if registration page exist', async () => {
			let res = await supertest.get("/register").expect(200);
		});
		it('should fail if username, email and password are missing', async () => {
			let res = await supertest.post("/register").expect(400);
			
			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.be.equal('validation');
			// expect(res.body.error.errors).to.include({
			// 	username: 'missing',
			// 	email: 'missing',
			// 	password: 'missing'
			// });
		});
		it('should fail if username is invalid', async () => {
			let res = await supertest.post("/register")
			.send({
				username: 'username!'
			}).expect(400);
			
			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.be.equal('validation');
			// expect(res.body.error.errors).to.include({
			// 	username: 'invalid'
			// });
		});
		it('should fail if email is invalid', async () => {
			let res = await supertest.post("/register")
			.send({
				email: 'email'
			}).expect(400);
			
			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.be.equal('validation');
			// expect(res.body.error.errors).to.include({
			// 	email: 'invalid'
			// });
		});
		it('should fail if password is invalid', async () => {
			let res = await supertest.post("/register")
			.send({
				password: 'password'
			}).expect(400);
			
			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.be.equal('validation');
			// expect(res.body.error.errors).to.include({
			// 	password: 'invalid'
			// });
		});
		it('should fail if password confirmation is missing', async () => {
			let res = await supertest.post("/register")
			.send({
				password: 'P4ssw0rd!'
			}).expect(400);
			
			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.be.equal('validation');
			// expect(res.body.error.errors).to.include({
			// 	passwordConfirmation: 'missing'
			// });
		});
		it('should fail if password confirmation is invalid', async () => {
			let res = await supertest.post("/register")
			.send({
				password: 'P4ssw0rd!',
				passwordConfirmation: 'P4ssw0rd'
			}).expect(400);
			
			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.be.equal('validation');
			// expect(res.body.error.errors).to.include({
			// 	passwordConfirmation: 'invalid'
			// });
		});
		it('should fail if username is taken', async () => {
			let user = await tempUser({username: 'testuser'});

			let res = await supertest.post("/register")
			.send({
				username: 'testuser',
				email: 'test2@email.com',
				password: 'P4ssw0rd!',
				passwordConfirmation: 'P4ssw0rd!'
			}).expect(400);

			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.be.equal('server');
			// expect(res.body.error.message).to.be.equals('Username testuser already exist.');

			await user.remove();
		});
		it('should fail if email is taken', async () => {
			let user = await tempUser({email: 'test@email.com'});

			let res = await supertest.post("/register")
			.send({
				username: 'testuser2',
				email: 'test@email.com',
				password: 'P4ssw0rd!',
				passwordConfirmation: 'P4ssw0rd!'
			}).expect(400);

			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.be.equal('server');
			// expect(res.body.error.message).to.be.equals('Email test@email.com already exist.');

			await user.remove();
		});
		it('should pass if all fields are valid', async () => {
			let res = await supertest.post("/register")
			.send({
				username: 'testuser',
				email: 'user@email.com',
				password: 'P4ssw0rd!',
				passwordConfirmation: 'P4ssw0rd!'
			}).redirects(1).expect(200);
			
			// expect(res.body.success).to.be.true;
			// expect(res.body.data).to.exist;

			let user = await User.findOne({username: 'testuser'});
			await user.remove();
		});
	});

	describe('Login tests', () => {
		it('should fail username is invalid', async () => {
			let user = await tempUser({
				username: 'testuser',
				password: 'P4ssw0rd!'
			});

			let res = await supertest.post("/login")
			.send({
				password: 'P4ssw0rd!'
			}).redirects(1).expect(200);
			
			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.equals('authentication');
			// expect(res.body.error.message).to.equals('Invalid username or password');

			await user.remove();
		});
		it('should fail password is invalid', async () => {
			let user = await tempUser({
				username: 'testuser',
				password: 'P4ssw0rd!'
			});

			let res = await supertest.post("/login")
			.send({
				username: 'testuser'
			}).redirects(1).expect(200);
			
			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.equals('authentication');
			// expect(res.body.error.message).to.equals('Invalid username or password');

			await user.remove();
		});
		it('should fail email is not confirmed', async () => {
			let user = await tempUser({
				username: 'testuser',
				password: 'P4ssw0rd!',
				active: false
			});

			let res = await supertest.post("/login")
			.send({
				username: 'testuser',
				password: 'P4ssw0rd!'
			}).redirects(1).expect(200);
			
			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.equals('authentication');
			// expect(res.body.error.message).to.equals('Email not confirmed');

			await user.remove();
		});
		it('should pass if login', async () => {
			let user = await tempUser({password: 'P4ssw0rd!'});

			let res = await supertest.post("/login")
			.send({
				username: user.username,
				password: 'P4ssw0rd!'
			}).redirects(1).expect(200);
			
			// expect(res.body.success).to.be.true;
			// expect(res.body.token).to.exist;

			await user.remove();
		});
	});

	// describe('Account tests', () => {
	// 	it('should fail if not authenticated', async () => {
	// 		let res = await supertest.get("/account").expect(400);

	// 		// expect(res.body.success).to.be.false;
	// 		// expect(res.body.error.type).to.equals('authentication');
	// 		// expect(res.body.error.message).to.equals('Unauthorized access');
	// 	});
		
	// 	it('should fail if invalid token', async () => {
	// 		let res = await supertest.get("/account").set('Authorization', 'Bearer invalid').expect(400);
			
	// 		// expect(res.body.success).to.be.false;
	// 		// expect(res.body.error.type).to.equals('authentication');
	// 		// expect(res.body.error.message).to.equals('Invalid token');
	// 	});
		
	// 	it('should fail if token payload invalid', async () => {
	// 		let user = await tempUser();

	// 		let token = generateToken({
	// 			email: user.email,
	// 			username: user.username
	// 		});
			
	// 		let res = await supertest.get("/account").set('Authorization', 'Bearer '+token).expect(400);
			
	// 		// expect(res.body.success).to.be.false;
	// 		// expect(res.body.error.type).to.equals('authentication');
	// 		// expect(res.body.error.message).to.equals('Unauthorized access');

	// 		await user.remove();
	// 	});
		
	// 	it('should fail if id invalid', async () => {
	// 		let user = await tempUser();

	// 		let token = generateToken({
	// 			_id: '0',
	// 			email: user.email,
	// 			username: user.username
	// 		});
			
	// 		let res = await supertest.get("/account").set('Authorization', 'Bearer '+token).expect(400);
			
	// 		// expect(res.body.success).to.be.false;
	// 		// expect(res.body.error.type).to.equals('server');
	// 		// expect(res.body.error.message).to.equals('Server error');

	// 		await user.remove();
	// 	});
		
	// 	it('should fail if token id not found', async () => {
	// 		let user = await tempUser();

	// 		let token = generateToken({
	// 			_id: '5b1f13def178ac167cfb2ce5',
	// 			email: user.email,
	// 			username: user.username
	// 		});
			
	// 		let res = await supertest.get("/account").set('Authorization', 'Bearer '+token).expect(400);
			
	// 		// expect(res.body.success).to.be.false;
	// 		// expect(res.body.error.type).to.equals('server');
	// 		// expect(res.body.error.message).to.equals('User not found');

	// 		await user.remove();
	// 	});
		
	// 	it('should fail if token revoked', async () => {
	// 		let user = await tempUser();

	// 		let token = generateToken({
	// 			_id: user._id,
	// 			email: user.email,
	// 			username: user.username,
	// 			iat: 1
	// 		});
			
	// 		let res = await supertest.get("/account").set('Authorization', 'Bearer '+token).expect(400);
			
	// 		// expect(res.body.success).to.be.false;
	// 		// expect(res.body.error.type).to.equals('authentication');
	// 		// expect(res.body.error.message).to.equals('Token revoked');

	// 		await user.remove();
	// 	});
		
	// 	it('should pass if authenticated', async () => {
	// 		let user = await tempUser();

	// 		let token = generateToken({
	// 			_id: user._id,
	// 			email: user.email,
	// 			username: user.username
	// 		});
			
	// 		let res = await supertest.get("/account").set('Authorization', 'Bearer '+token).expect(200);
			
	// 		// expect(res.body.success).to.be.true;
	// 		// expect(res.body.data).to.include({
	// 		// 	email: user.email,
	// 		// 	username: user.username
	// 		// });

	// 		await user.remove();
	// 	});
	// });

	// describe('Recover tests', () => {
	// 	it('should fail if email is missing', async () => {
	// 		let res = await supertest.post("/api/recover").expect(400);
			
	// 		expect(res.body.success).to.be.false;
	// 		expect(res.body.error.type).to.equals('validation');
	// 		expect(res.body.error.errors).to.deep.include({
	// 			email: 'missing'
	// 		});
	// 	});
		
	// 	it('should fail if email is invalid', async () => {
	// 		let res = await supertest.post("/api/recover")
	// 		.send({email: 'email'}).expect(400);
			
	// 		expect(res.body.success).to.be.false;
	// 		expect(res.body.error.type).to.equals('validation');
	// 		expect(res.body.error.errors).to.deep.include({
	// 			email: 'invalid'
	// 		});
	// 	});
		
	// 	it('should fail if email not found', async () => {
	// 		let res = await supertest.post("/api/recover")
	// 		.send({email: 'test@email.com'}).expect(400);
			
	// 		expect(res.body.success).to.be.false;
	// 		expect(res.body.error.type).to.equals('server');
	// 		expect(res.body.error.message).to.be.equals('Email not found');
	// 	});
		
	// 	it('should fail if user not active', async () => {
	// 		let user = await tempUser({
	// 			email: 'test@email.com',
	// 			active: false
	// 		});

	// 		let res = await supertest.post("/api/recover")
	// 		.send({email: 'test@email.com'}).expect(400);
			
	// 		expect(res.body.success).to.be.false;
	// 		expect(res.body.error.type).to.equals('server');
	// 		expect(res.body.error.message).to.be.equals('User not active');

	// 		await user.remove();
	// 	});
		
	// 	it('should pass if password reset', async () => {
	// 		let user = await tempUser({
	// 			email: 'test@email.com'
	// 		});

	// 		let res = await supertest.post("/api/recover")
	// 		.send({email: 'test@email.com'}).expect(200);
			
	// 		expect(res.body.success).to.be.true;
	// 		expect(res.body.message).to.be.equals('Password sent to email');

	// 		await user.remove();
	// 	});
	// });

	// describe('Update tests', () => {
	// 	it('should fail if invalid username', async () => {
	// 		let user = await tempUser();

	// 		let token = generateToken({
	// 			_id: user._id,
	// 			email: user.email,
	// 			username: user.username
	// 		});
			
	// 		let res = await supertest.put("/api/account").set('Authorization', 'Bearer '+token)
	// 		.send({
	// 			username: 'username!'
	// 		}).expect(400);
			
	// 		expect(res.body.success).to.be.false;
	// 		expect(res.body.error.type).to.be.equals('validation');
	// 		expect(res.body.error.errors).to.deep.include({
	// 			username: 'invalid'
	// 		})

	// 		await user.remove();
	// 	});

	// 	it('should pass if username valid', async () => {
	// 		let user = await tempUser();

	// 		let token = generateToken({
	// 			_id: user._id,
	// 			email: user.email,
	// 			username: user.username
	// 		});
			
	// 		let res = await supertest.put("/api/account").set('Authorization', 'Bearer '+token)
	// 		.send({
	// 			username: 'newname'
	// 		}).expect(200);
			
	// 		expect(res.body.success).to.be.true;
	// 		expect(res.body.data).to.deep.include({
	// 			username: 'newname'
	// 		})

	// 		await user.remove();
	// 	});
	// 	it('should fail if invalid email', async () => {
	// 		let user = await tempUser();

	// 		let token = generateToken({
	// 			_id: user._id,
	// 			email: user.email,
	// 			username: user.username
	// 		});
			
	// 		let res = await supertest.put("/api/account").set('Authorization', 'Bearer '+token)
	// 		.send({
	// 			email: 'mail!'
	// 		}).expect(400);
			
	// 		expect(res.body.success).to.be.false;
	// 		expect(res.body.error.type).to.be.equals('validation');
	// 		expect(res.body.error.errors).to.deep.include({
	// 			email: 'invalid'
	// 		})

	// 		await user.remove();
	// 	});

	// 	it('should pass if email valid', async () => {
	// 		let user = await tempUser();

	// 		let token = generateToken({
	// 			_id: user._id,
	// 			email: user.email,
	// 			username: user.username
	// 		});
			
	// 		let res = await supertest.put("/api/account").set('Authorization', 'Bearer '+token)
	// 		.send({
	// 			email: 'new@email.com'
	// 		}).expect(200);
			
	// 		expect(res.body.success).to.be.true;
	// 		expect(res.body.data).to.deep.include({
	// 			email: 'new@email.com'
	// 		})

	// 		await user.remove();
	// 	});
	// 	it('should fail if invalid password', async () => {
	// 		let user = await tempUser();

	// 		let token = generateToken({
	// 			_id: user._id,
	// 			email: user.email,
	// 			username: user.username
	// 		});
			
	// 		let res = await supertest.put("/api/account").set('Authorization', 'Bearer '+token)
	// 		.send({
	// 			password: 'password'
	// 		}).expect(400);
			
	// 		expect(res.body.success).to.be.false;
	// 		expect(res.body.error.type).to.be.equals('validation');
	// 		expect(res.body.error.errors).to.deep.include({
	// 			password: 'invalid'
	// 		})

	// 		await user.remove();
	// 	});

	// 	it('should fail if invalid password confirmation', async () => {
	// 		let user = await tempUser();

	// 		let token = generateToken({
	// 			_id: user._id,
	// 			email: user.email,
	// 			username: user.username
	// 		});
			
	// 		let res = await supertest.put("/api/account").set('Authorization', 'Bearer '+token)
	// 		.send({
	// 			password: 'Passw0rd?',
	// 			passwordConfirmation: 'Passw0rd!'
	// 		}).expect(400);
			
	// 		expect(res.body.success).to.be.false;
	// 		expect(res.body.error.type).to.be.equals('validation');
	// 		expect(res.body.error.errors).to.deep.include({
	// 			passwordConfirmation: 'invalid'
	// 		})

	// 		await user.remove();
	// 	});

	// 	it('should pass if password and confirmation valid', async () => {
	// 		let user = await tempUser();

	// 		let token = generateToken({
	// 			_id: user._id,
	// 			email: user.email,
	// 			username: user.username
	// 		});
			
	// 		let res = await supertest.put("/api/account").set('Authorization', 'Bearer '+token)
	// 		.send({
	// 			password: 'P4ssw@rd!',
	// 			passwordConfirmation: 'P4ssw@rd!',
	// 		})
			
	// 		expect(res.body.success).to.be.true;
	// 		expect(res.body.token).to.exist;

	// 		await user.remove();
	// 	});
	// });

	// describe('Delete tests', () => {
	// 	it('should pass if account deleted', async () => {
	// 		let user = await tempUser();

	// 		let token = generateToken({
	// 			_id: user._id,
	// 			email: user.email,
	// 			username: user.username
	// 		});
			
	// 		let res = await supertest.delete("/api/account").set('Authorization', 'Bearer '+token).expect(200);
			
	// 		expect(res.body.success).to.be.true;
	// 		expect(res.body.data.status).to.be.equals('User deleted');

	// 		await user.remove();
	// 	});
	// });
});