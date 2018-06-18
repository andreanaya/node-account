const chai = require('chai');
const expect = chai.expect;
const app = require('../app/index');
const supertest = require('supertest')(app);
const signature = require('cookie-signature');
const {tempUser} = require('./utils');
const User = require('../app/models/User');
const jwt = require('jsonwebtoken');
const {generateToken} = require('../app/utils/Token');
const {notification} = require('../app/utils/QueryNotification');

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
			}).expect(302);

			expect(res.headers.location).to.be.equals('/login?'+notification('alert', 'Please confirm your email address to complete your registration.'))
			
			let user = await User.findOne({username: 'testuser'});
			await user.remove();
		});
	});

	describe('Confirm tests', () => {
		it('should fail if token malformed', async () => {
			let res = await supertest.get("/confirm/0").expect(302);

			expect(res.headers.location).to.be.equals('/login?'+notification('authentication', 'Invalid token'));
		});

		it('should fail if user not found', async () => {
			let token = generateToken({
				_id: '5b1f13def178ac167cfb2ce5',
				email: 'test@andreanaya.com'
			});

			let res = await supertest.get("/confirm/"+token).expect(302);

			expect(res.headers.location).to.be.equals('/login?'+notification('server', 'User not found'));
		});

		it('should fail user already confirmed', async () => {
			let user = await tempUser();

			let token = generateToken({
				_id: user._id,
				email: user.email
			});

			let res = await supertest.get("/confirm/"+token).expect(302);

			expect(res.headers.location).to.be.equals('/login?'+notification('server', 'User already active.'));

			await user.remove();
		});

		it('should pass if email confirmed', async () => {
			let user = await tempUser({active: false});

			let token = generateToken({
				_id: user._id,
				email: user.email
			});

			let res = await supertest.get("/confirm/"+token).expect(302);

			expect(res.headers.location).to.be.equals('/login?'+notification('confirmation', 'Registration complete.'));

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
			}).expect(302);
			
			expect(res.headers.location).to.be.equals('/login?'+notification('authentication', 'Invalid username or password'))
			
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
			}).expect(302);
			
			expect(res.headers.location).to.be.equals('/login?'+notification('authentication', 'Invalid username or password'))

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
			}).expect(302);

			expect(res.headers.location).to.be.equals('/login?'+notification('authentication', 'Email not confirmed'))
			
			await user.remove();
		});

		it('should pass if login', async () => {
			let user = await tempUser({password: 'P4ssw0rd!'});

			let res = await supertest.post("/login")
			.send({
				username: user.username,
				password: 'P4ssw0rd!'
			}).expect(302);

			let cookies = res.headers['set-cookie'].pop().split('; ').reduce((cookies, cookie) => {
				cookies[cookie.split('=')[0]] = cookie.split('=')[1];
				return cookies;
			}, {});

			expect(cookies.token).to.exist;
			expect(res.headers.location).to.be.equals('/account');

			await user.remove();
		});
	});

	describe('Account tests', () => {
		it('should fail if not authenticated', async () => {
			let res = await supertest.get("/account").expect(302);

			expect(res.headers.location).to.be.equals('/login?'+notification('authentication', 'Unauthorized access'));
		});
		
		it('should fail if invalid cookie', async () => {
			let res = await supertest.get("/account").set('Cookie', 'token=invalid').expect(302);
			expect(res.headers.location).to.be.equals('/login?'+notification('authentication', 'Unauthorized access'));
		});
		
		it('should fail if token payload invalid', async () => {
			let user = await tempUser();

			let token = signature.sign(generateToken({
				email: user.email,
				username: user.username
			}), process.env.TOKEN_SECRET)
			
			let res = await supertest.get("/account").set('Cookie', 'token=s:'+token).expect(302);

			expect(res.headers.location).to.be.equals('/login?'+notification('authentication', 'Unauthorized access'));

			await user.remove();
		});
		
		it('should fail if id invalid', async () => {
			let user = await tempUser();

			let token = signature.sign(generateToken({
				_id: '0',
				email: user.email,
				username: user.username
			}), process.env.TOKEN_SECRET)
			
			let res = await supertest.get("/account").set('Cookie', 'token=s:'+token).expect(302);

			expect(res.headers.location).to.be.equals('/login?'+notification('server', 'Server error'));

			await user.remove();
		});
		
		it('should fail if token id not found', async () => {
			let user = await tempUser();

			let token = signature.sign(generateToken({
				_id: '5b1f13def178ac167cfb2ce5',
				email: user.email,
				username: user.username
			}), process.env.TOKEN_SECRET)
			
			let res = await supertest.get("/account").set('Cookie', 'token=s:'+token).expect(302);

			expect(res.headers.location).to.be.equals('/login?'+notification('server', 'User not found'));

			await user.remove();
		});
		
		it('should fail if token revoked', async () => {
			let user = await tempUser();

			let token = signature.sign(generateToken({
				_id: user._id,
				email: user.email,
				username: user.username,
				iat: 1
			}), process.env.TOKEN_SECRET)
			
			let res = await supertest.get("/account").set('Cookie', 'token=s:'+token).expect(302);

			expect(res.headers.location).to.be.equals('/login?'+notification('authentication', 'Token revoked'));

			await user.remove();
		});
		
		it('should pass if authenticated', async () => {
			let user = await tempUser();

			let token = signature.sign(generateToken({
				_id: user._id,
				email: user.email,
				username: user.username
			}), process.env.TOKEN_SECRET)
			
			let res = await supertest.get("/account").set('Cookie', 'token=s:'+token).expect(200);

			await user.remove();
		});
	});

	describe('Recover tests', () => {
		it('should pass if reset password form exist', async () => {
			let res = await supertest.get("/recover").expect(200);
			
			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.equals('validation');
			// expect(res.body.error.errors).to.deep.include({
			// 	email: 'missing'
			// });
		});
		
		it('should fail if email is missing', async () => {
			let res = await supertest.post("/recover").expect(400);
			
			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.equals('validation');
			// expect(res.body.error.errors).to.deep.include({
			// 	email: 'missing'
			// });
		});
		
		it('should fail if email is invalid', async () => {
			let res = await supertest.post("/recover")
			.send({email: 'email'}).expect(400);
			
			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.equals('validation');
			// expect(res.body.error.errors).to.deep.include({
			// 	email: 'invalid'
			// });
		});
		
		it('should fail if email not found', async () => {
			let res = await supertest.post("/recover")
			.send({email: 'test@email.com'}).expect(400);
			
			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.equals('server');
			// expect(res.body.error.message).to.be.equals('Email not found');
		});
		
		it('should fail if user not active', async () => {
			let user = await tempUser({
				email: 'test@email.com',
				active: false
			});

			let res = await supertest.post("/recover")
			.send({email: 'test@email.com'}).expect(400);
			
			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.equals('server');
			// expect(res.body.error.message).to.be.equals('User not active');

			await user.remove();
		});
		
		it('should pass if password reset', async () => {
			let user = await tempUser({
				email: 'test@email.com'
			});

			let res = await supertest.post("/recover")
			.send({email: 'test@email.com'}).expect(302);

			expect(res.headers.location).to.be.equals('/login?'+notification('confirmation', 'A new password was sent to your email.'));

			// expect(res.body.success).to.be.true;
			// expect(res.body.message).to.be.equals('Password sent to email');

			await user.remove();
		});
	});

	describe('Update tests', () => {
		it('should pass if update form exist', async () => {
			let user = await tempUser();

			let token = signature.sign(generateToken({
				_id: user._id,
				email: user.email,
				username: user.username
			}), process.env.TOKEN_SECRET)
			
			let res = await supertest.get("/update").set('Cookie', 'token=s:'+token).expect(200);

			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.be.equals('validation');
			// expect(res.body.error.errors).to.deep.include({
			// 	username: 'invalid'
			// })

			await user.remove();
		});
		it('should fail if invalid username', async () => {
			let user = await tempUser();

			let token = signature.sign(generateToken({
				_id: user._id,
				email: user.email,
				username: user.username
			}), process.env.TOKEN_SECRET)
			
			let res = await supertest.post("/update").set('Cookie', 'token=s:'+token)
			.send({
				username: 'user'
			}).expect(400);

			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.be.equals('validation');
			// expect(res.body.error.errors).to.deep.include({
			// 	username: 'invalid'
			// })

			await user.remove();
		});

		it('should pass if username valid', async () => {
			let user = await tempUser();

			let token = signature.sign(generateToken({
				_id: user._id,
				email: user.email,
				username: user.username
			}), process.env.TOKEN_SECRET)
			
			let res = await supertest.post("/update").set('Cookie', 'token=s:'+token)
			.send({
				username: 'newname'
			}).expect(302);

			expect(res.headers.location).to.be.equals('/account?'+notification('status', 'Account updated'));

			await user.remove();
		});
		it('should fail if invalid email', async () => {
			let user = await tempUser();

			let token = signature.sign(generateToken({
				_id: user._id,
				email: user.email,
				username: user.username
			}), process.env.TOKEN_SECRET)
			
			let res = await supertest.post("/update").set('Cookie', 'token=s:'+token)
			.send({
				email: 'mail'
			}).expect(400);

			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.be.equals('validation');
			// expect(res.body.error.errors).to.deep.include({
			// 	email: 'invalid'
			// })

			await user.remove();
		});

		it('should pass if email valid', async () => {
			let user = await tempUser();

			let token = signature.sign(generateToken({
				_id: user._id,
				email: user.email,
				username: user.username
			}), process.env.TOKEN_SECRET)
			
			let res = await supertest.post("/update").set('Cookie', 'token=s:'+token)
			.send({
				email: 'new@email.com'
			}).expect(302);

			expect(res.headers.location).to.be.equals('/account?'+notification('status', 'Account updated'));

			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.be.equals('validation');
			// expect(res.body.error.errors).to.deep.include({
			// 	email: 'invalid'
			// })

			await user.remove();
		});
		it('should fail if invalid password', async () => {
			let user = await tempUser();

			let token = signature.sign(generateToken({
				_id: user._id,
				email: user.email,
				username: user.username
			}), process.env.TOKEN_SECRET)
			
			let res = await supertest.post("/update").set('Cookie', 'token=s:'+token)
			.send({
				password: 'password'
			}).expect(400);
			
			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.be.equals('validation');
			// expect(res.body.error.errors).to.deep.include({
			// 	password: 'invalid'
			// })

			await user.remove();
		});

		it('should fail if invalid password confirmation', async () => {
			let user = await tempUser();

			let token = signature.sign(generateToken({
				_id: user._id,
				email: user.email,
				username: user.username
			}), process.env.TOKEN_SECRET)
			
			let res = await supertest.post("/update").set('Cookie', 'token=s:'+token)
			.send({
				password: 'Passw0rd?',
				passwordConfirmation: 'Passw0rd!'
			}).expect(400);

			// expect(res.body.success).to.be.false;
			// expect(res.body.error.type).to.be.equals('validation');
			// expect(res.body.error.errors).to.deep.include({
			// 	passwordConfirmation: 'invalid'
			// })

			await user.remove();
		});

		it('should pass if password and confirmation valid', async () => {
			let user = await tempUser();

			let token = signature.sign(generateToken({
				_id: user._id,
				email: user.email,
				username: user.username
			}), process.env.TOKEN_SECRET)
			
			let res = await supertest.post("/update").set('Cookie', 'token=s:'+token)
			.send({
				password: 'P4ssw@rd!',
				passwordConfirmation: 'P4ssw@rd!',
			}).expect(302);

			let cookies = res.headers['set-cookie'].pop().split('; ').reduce((cookies, cookie) => {
				cookies[cookie.split('=')[0]] = cookie.split('=')[1];
				return cookies;
			}, {});

			expect(cookies.token).to.exist;
			expect(res.headers.location).to.be.equals('/account?'+notification('status', 'Account updated'));
			
			// expect(res.body.success).to.be.true;
			// expect(res.body.token).to.exist;

			await user.remove();
		});
	});

	describe('Delete tests', () => {
		it('should pass if account deleted', async () => {
			let user = await tempUser();

			let token = signature.sign(generateToken({
				_id: user._id,
				email: user.email,
				username: user.username
			}), process.env.TOKEN_SECRET)
			
			let res = await supertest.post("/delete").set('Cookie', 'token=s:'+token).expect(302)

			expect(res.headers.location).to.be.equals('/register?'+notification('confirmation', 'Account deleted'));
			
			// expect(res.body.success).to.be.true;
			// expect(res.body.data.status).to.be.equals('User deleted');

			await user.remove();
		});
	});
});