const User = require('../models/User');
const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');
const { password } = require('../utils/RegExp');
const Mail = require('../utils/Mail');
const { generateToken, verify } = require('../utils/Token');
const passport = require('passport');

exports.register = {
	validation: [
		sanitize('username').trim().escape(),
		sanitize('email').trim().normalizeEmail({
			gmail_remove_dots: false,
			gmail_remove_subaddress: false
		}),
		sanitize('password').trim(),
		check('username')
			.exists().withMessage('missing')
			.isLength({min: 5}).withMessage('invalid'),
		check('email')
			.exists().withMessage('missing')
			.isEmail().withMessage('invalid'),
		check('password')
			.exists().withMessage('missing')
			.matches(password()).withMessage('invalid'),
		check('passwordConfirmation')
			.exists().withMessage('missing')
			.custom((value, { req }) => value === req.body.password).withMessage('invalid')
	],
	handler: async (req, res) => {
		let errors = validationResult(req);
		
		if(errors.isEmpty()) {
			let model = new User({
				username: req.body.username,
				email: req.body.email,
				password: req.body.password
			});

			try {
				let data = await model.save();

				let token = generateToken({
					_id: data._id,
					email: data.email
				});

				let url = 'http://localhost:3000/confirm/'+token;

				Mail.sendMail({
					from: 'hello@andreanaya.com',
					to: req.body.email,
					subject: 'Please confirm your email',
					text: 'Please click on the link bellow to confirm your email.\n\n'+url+'.',
					html: '<p>Please click on the link bellow to confirm your email</p><a href="'+url+'" target="_blank">'+url+'</a>'
				}, (err, info) => {
					// if(err) console.log(err);
					// if(info) console.log('Email sent', info);
				});

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
	}
}

exports.confirm = {
	handler: async function(req, res) {
		let token = req.params.token;

		try {
			var payload = verify(token);

			let model = await User.findById(payload._id);

			if(model.active === false) {
				model.active = true;
				await model.save();
				res.status(200).send('Email confirmed');
			} else {
				throw new Error('User active');
			}
		} catch(err) {
			res.status(400).send(err.message);
		}
	}
}

exports.authenticate = {
	validation: [
		sanitize('username').trim().escape(),
		sanitize('password').trim().escape()
	],
	handler: function(req, res) {
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
					info: info
				});
			}
		})(req, res);
	}
}

exports.reset = {
	validation: [
		sanitize('email').trim().normalizeEmail({
			gmail_remove_dots: false,
			gmail_remove_subaddress: false
		}),
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
	handler: async function(req, res) {
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
	}
}

exports.update = {
	validation: [
		sanitize('username').trim().escape(),
		sanitize('email').trim().normalizeEmail({
			gmail_remove_dots: false,
			gmail_remove_subaddress: false
		}),
		sanitize('password').trim(),
		check('username')
			.optional()
			.isLength({min: 5}).withMessage('invalid'),
		check('email')
			.optional()
			.isEmail().withMessage('invalid'),
		check('password')
			.optional()
			.matches(password()).withMessage('invalid'),
		check('passwordConfirmation')
			.custom((value, { req }) => req.body.password !== undefined ? value === req.body.password : true).withMessage('invalid')
	],
	handler: async function(req, res) {
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
						if(req.body.username) model.username = req.body.username;
						if(req.body.email) model.email = req.body.email;
						if(req.body.password) model.password = req.body.password;

						let data = await model.save();

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
		res.status(500);
		res.json({
			success: false,
			error: {}
		});
	}

	next();
}
