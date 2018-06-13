const User = require('../models/User');
const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');
const { password } = require('../utils/RegExp');
const Mail = require('../utils/Mail');
const { generateToken, verify } = require('../utils/Token');
const passport = require('passport');

const register = async function(params) {
	let model = new User(params);

	let data = await model.save();

	let token = generateToken({
		_id: data._id,
		email: data.email
	});

	let url = 'https://localhost:3000/confirm/'+token;

	Mail.sendMail({
		from: 'hello@andreanaya.com',
		to: data.email,
		subject: 'Please confirm your email',
		text: 'Please click on the link bellow to confirm your email.\n\n'+url+'.',
		html: '<p>Please click on the link bellow to confirm your email</p><a href="'+url+'" target="_blank">'+url+'</a>'
	}, (err, info) => {
		// if(err) console.log(err);
		// if(info) console.log('Email sent', info);
	});
}

exports.register = {
	validation: [
		check('username')
			.exists().withMessage('missing')
			.isLength({min: 5}).isAlphanumeric().withMessage('invalid'),
		check('email')
			.exists().withMessage('missing')
			.isEmail().withMessage('invalid'),
		check('password')
			.exists().withMessage('missing')
			.matches(password()).withMessage('invalid'),
		check('passwordConfirmation')
			.exists().withMessage('missing')
			.custom((value, { req }) => value === req.body.password).withMessage('invalid'),
		sanitize('username').trim().escape(),
		sanitize('email').trim(),
		sanitize('password').trim()
	],
	api: async (req, res) => {
		let errors = validationResult(req);
		
		if(errors.isEmpty()) {
			try {
				await register({
					username: req.body.username,
					email: req.body.email,
					password: req.body.password
				})

				res.status(200).json({
					success: true,
					data: data
				});
			} catch(err) {
				res.status(400).json({
					success: false,
					error: err
				});
			}
		} else {
			res.status(400).json({
				success: false,
				errors: errors.array().map((error) => {
					return {
						field: error.param,
						message: error.msg
					}
				})
			});
		}
	},
	webGET: async (req, res) => {
		var options = {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/Register.hbs',
				data: {
					title: 'User registration'
				}
			}
		};
		
		res.render('base.hbs', options);
	},
	webPOST: async (req, res) => {
		let errors = validationResult(req);
		
		if(errors.isEmpty()) {
			try {
				await register({
					username: req.body.username,
					email: req.body.email,
					password: req.body.password
				})

				res.status(200).render('base.hbs', {
					model: {
						isDev: process.env.NODE_ENV === 'dev',
						template: 'layouts/RegistrationComplete.hbs',
						data: {
							title: 'Registration complete',
							email: req.body.email
						}
					}
				});
			} catch(err) {
				let errorList = {};

				if(err.code === 11000 && err.message.indexOf('username') > -1) {
					errorList.username = 'Username '+req.body.username+' already exist.';
				} else if(err.code === 11000 && err.message.indexOf('email') > -1) {
					errorList.email = 'Email '+req.body.email+' already exist.'
				} else {
					errorList.server = 'Server error, please try again.';
				}

				res.status(400).render('base.hbs', {
					model: {
						isDev: process.env.NODE_ENV === 'dev',
						template: 'layouts/Register.hbs',
						data: {
							title: 'User registration',
							fields: {
								username: req.body.username,
								email: req.body.email
							},
							errors: errorList
						}
					}
				});
			}
		} else {
			res.status(400).render('base.hbs', {
				model: {
					isDev: process.env.NODE_ENV === 'dev',
					template: 'layouts/Register.hbs',
					data: {
						title: 'User registration',
						fields: {
							username: req.body.username,
							email: req.body.email
						},
						errors: errors.array().reduce((list, error) => {
							list[error.param] = error.msg;
							return list
						}, {})
					}
				}
			});
		}
	}
}

exports.confirm = {
	validation: [
		sanitize('token').trim().escape(),
		check('token').isHash('sha256')
	],
	webGET: async function(req, res) {
		let token = req.params.token;

		try {
			var payload = verify(token);

			let model = await User.findById(payload._id);

			if(model.active === false) {
				model.active = true;
				await model.save();

				res.status(200).render('base.hbs', {
					model: {
						isDev: process.env.NODE_ENV === 'dev',
						template: 'layouts/Login.hbs',
						data: {
							title: 'Email confirmed',
							message: 'Your account is now active. Please login to view your details.'
						}
					}
				});
			} else {
				res.status(200).render('base.hbs', {
					model: {
						isDev: process.env.NODE_ENV === 'dev',
						template: 'layouts/Login.hbs',
						data: {
							title: 'Login',
							message: 'Your account is already active. Please login to view your details.'
						}
					}
				});
			}
		} catch(err) {
			res.status(200).render('base.hbs', {
				model: {
					isDev: process.env.NODE_ENV === 'dev',
					template: 'layouts/Register.hbs',
					data: {
						title: 'Login',
						message: 'Your email could not be confirmed, please register again with a different email.'
					}
				}
			});
		}
	}
}

exports.authenticate = {
	validation: [
		sanitize('username').trim().escape(),
		sanitize('password').trim().escape()
	],
	api: function(req, res) {
		passport.authenticate('local', function(user, info){
			if(user){
				if(user.active) {
					let token = generateToken({
						_id: user._id,
						email: user.email,
						username: user.username
					});
					
					res.status(200).json({
						success: true,
						token: token
					});
				} else {
					res.status(401).json({
						success: false,
						info: {
							message: 'User not confirmed'
						}
					});	
				}
			} else {
				res.status(401).json({
					success: false,
					info: {
						message: info.message
					}
				});
			}
		})(req, res);
	},
	webGET: function(req, res) {
		res.status(200).render('base.hbs', {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/Login.hbs',
				data: {
					title: 'Login'
				}
			}
		});
	},
	webPOST: function(req, res) {
		passport.authenticate('local', function(user, info){
			if(user){
				if(user.active) {
					let token = generateToken({
						_id: user._id,
						email: user.email,
						username: user.username
					});
					

					res.status(200)
					.cookie('token', token, { signed: true, secure: true, httpOnly: true})
					.render('base.hbs', {
						model: {
							isDev: process.env.NODE_ENV === 'dev',
							template: 'layouts/Account.hbs',
							data: {
								title: 'Account',
								username: user.username,
								email: user.email
							}
						}
					});
				} else {
					res.status(401).render('base.hbs', {
						model: {
							isDev: process.env.NODE_ENV === 'dev',
							template: 'layouts/Login.hbs',
							data: {
								title: 'Login Error',
								username: req.body.username,
								error: 'Email not confirmed'
							}
						}
					});
				}
			} else {
				res.status(401).render('base.hbs', {
					model: {
						isDev: process.env.NODE_ENV === 'dev',
						template: 'layouts/Login.hbs',
						data: {
							title: 'Login Error',
							username: req.body.username,
							error: 'Invalid username or password'
						}
					}
				});
			}
		})(req, res);
	}
}

exports.logout = {
	webGET: function(req, res) {
		res.status(200)
		.cookie('token', '', { expires: new Date(0), secure: true, signed: true, httpOnly: true})
		.render('base.hbs', {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/Login.hbs',
				data: {
					title: 'Login'
				}
			}
		});
	}
}

exports.reset = {
	validation: [
		sanitize('email').trim(),
		check('email')
			.optional()
			.isEmail().withMessage('invalid'),
	],
	handler: async function(req, res) {
		try {
			let model = await User.findOne({email: req.body.email});

			if(model.active) {
				let password = Math.random().toString(36).slice(-8);

				model.password = password;

				await model.save();

				Mail.sendMail({
					from: 'hello@andreanaya.com',
					to: req.body.email,
					subject: 'Password reset',
					html: '<p>Your new password is: '+password+'</p>'
				}, (err, info) => {
					// if(err) console.log(err);
					// if(info) console.log('Email sent');
				});

				res.status(200).json({
					success: true,
					message: 'Password sent to email'
				});
			} else {
				throw new Error('User not active')
			}
		} catch(error) {
			res.status(401).json({
				success: false,
				info: {message: error.message}
			});
		}
	}
}

exports.account = {
	api: async function(req, res) {
		if (!req.payload._id) {
			res.status(401).json({
				success: false,
				info: { message: 'Unauthorized access' }
			});
		} else {
			try {
				let model = await User.findById(req.payload._id);
				
				if(model.created <= req.payload.iat) {
					res.status(200).json({success: true, data:model});
				} else {
					throw new Error('Token revoked');
				}
			} catch(error) {
				res.status(400).json({
					success: false,
					info: {message: error.message}
				});
			}
		}
	},
	webGET: async function(req, res) {
		if (!req.payload || !req.payload._id) {
			res.status(401).render('base.hbs', {
				model: {
					isDev: process.env.NODE_ENV === 'dev',
					template: 'layouts/Login.hbs',
					data: {
						title: 'Unauthorized access',
						message: 'Please login to get access to this account'
					}
				}
			});
		} else {
			try {
				let model = await User.findById(req.payload._id);
				
				if(model.created <= req.payload.iat) {
					res.status(200)
					.render('base.hbs', {
						model: {
							isDev: process.env.NODE_ENV === 'dev',
							template: 'layouts/Account.hbs',
							data: {
								title: 'Account',
								username: model.username,
								email: model.email
							}
						}
					});
				} else {
					throw new Error('Token revoked');
				}
			} catch(error) {
				res.status(401).render('base.hbs', {
					model: {
						isDev: process.env.NODE_ENV === 'dev',
						template: 'layouts/Login.hbs',
						data: {
							title: 'Session expired',
							message: 'Please login to get access to this account'
						}
					}
				});
			}
		}
	}
}

exports.update = {
	validation: [
		sanitize('username').trim().escape(),
		sanitize('email').trim(),
		sanitize('password').trim(),
		check('username')
			.optional({checkFalsy: true})
			.isLength({min: 5}).withMessage('invalid'),
		check('email')
			.optional({checkFalsy: true})
			.isEmail().withMessage('invalid'),
		check('password')
			.optional({checkFalsy: true})
			.matches(password()).withMessage('invalid'),
		check('passwordConfirmation')
			.custom((value, { req }) => req.body.password !== undefined && req.body.password !== '' ? value === req.body.password : true).withMessage('invalid')
	],
	api: async function(req, res) {
		if (!req.payload._id) {
			res.status(401).json({
				success: false,
				info: { message: 'Unauthorized access' }
			});
		} else {
			let errors = validationResult(req);

			if(errors.isEmpty()) {
				try {
					let model = await User.findById(req.payload._id);

					if(model.created <= req.payload.iat) {
						if(req.body.username && req.body.username != '') model.username = req.body.username;
						if(req.body.email && req.body.username != '') model.email = req.body.email;
						if(req.body.password && req.body.username != '') model.password = req.body.password;

						let data = await model.save();

						let token = generateToken({
							_id: user._id,
							email: user.email,
							username: user.username
						});

						res.status(200).json({
							success: true,
							data: data,
							token: token
						});
					} else {
						throw new Error('Token revoked');
					}
				} catch(error) {
					res.status(400).json({
						success: false,
						error: {message: error.message}
					});
				}
			} else {
				res.status(400).json({
					success: false,
					errors: errors.array().map((error) => {
						return {
							field: error.param,
							message: error.msg
						}
					})
				});
			}
		}
	},
	webGET: async function(req, res) {
		if (!req.payload || !req.payload._id) {
			res.status(401).render('base.hbs', {
				model: {
					isDev: process.env.NODE_ENV === 'dev',
					template: 'layouts/Login.hbs',
					data: {
						title: 'Unauthorized access',
						message: 'Please login to get access to this account'
					}
				}
			});
		} else {
			try {
				let model = await User.findById(req.payload._id);
				
				if(model.created <= req.payload.iat) {
					res.status(200)
					.render('base.hbs', {
						model: {
							isDev: process.env.NODE_ENV === 'dev',
							template: 'layouts/UpdateDetails.hbs',
							data: {
								title: 'Account',
								username: model.username,
								email: model.email
							}
						}
					});
				} else {
					throw new Error('Token revoked');
				}
			} catch(error) {
				res.status(401).render('base.hbs', {
					model: {
						isDev: process.env.NODE_ENV === 'dev',
						template: 'layouts/Login.hbs',
						data: {
							title: 'Session expired',
							message: 'Please login to get access to this account'
						}
					}
				});
			}
		}
	},
	webPOST: async function(req, res) {
		if (!req.payload._id) {
			res.status(401).render('base.hbs', {
				model: {
					isDev: process.env.NODE_ENV === 'dev',
					template: 'layouts/Login.hbs',
					data: {
						title: 'Session expired',
						message: 'Please login to get access to this account'
					}
				}
			});
		} else {
			try {
				let model = await User.findById(req.payload._id);

				if(model.created <= req.payload.iat) {
					if(req.body.username) model.username = req.body.username;
					if(req.body.email) model.email = req.body.email;
					if(req.body.password) model.password = req.body.password;

					let data = await model.save();

					let token = generateToken({
						_id: data._id,
						email: data.email,
						username: data.username
					})

					res.status(200)
					.cookie('token', token, { signed: true, secure: true, httpOnly: true})
					.render('base.hbs', {
						model: {
							isDev: process.env.NODE_ENV === 'dev',
							template: 'layouts/Account.hbs',
							data: {
								title: 'Account',
								message: 'Your details were updated.',
								username: model.username,
								email: model.email
							}
						}
					});
				} else {
					throw new Error('Token revoked');
				}
			} catch(error) {
				res.status(401).render('base.hbs', {
					model: {
						isDev: process.env.NODE_ENV === 'dev',
						template: 'layouts/Login.hbs',
						data: {
							title: 'Session expired',
							message: 'Please login to get access to this account'
						}
					}
				});
			}
		}
	}
}

exports.delete = {
	handler: async function(req, res) {
		if (!req.payload._id) {
			res.status(401).json({
				success: false,
				info: { message: 'Unauthorized access' }
			});
		} else {
			try {
				let data = await User.findById(req.payload._id);
				
				if(data.created <= req.payload.iat) {
					await data.remove();

					res.status(200).json({
						success: true,
						data: data
					});
				} else {
					throw new Error('Token revoked');
				}
			} catch(error) {
				res.status(400).json({
					success: false,
					error: {message: error.message}
				});
			}
		}
	}
}

exports.error = function (err, req, res, next) {
	if (err.name === 'UnauthorizedError') {
		res.status(401).json({
			success: false,
			info: { message: 'Unauthorized access' }
		});
	} else {
		console.log(err)
		res.status(500);
		res.json({
			success: false,
			error: {}
		});
	}

	next();
}
