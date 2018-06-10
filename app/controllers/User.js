const User = require('../models/User');
const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');
const { password } = require('../utils/RegExp');
const passport = require('passport');

exports.register = {
	validation: [
		sanitize('username').trim(),
		sanitize('email').trim().normalizeEmail({
			gmail_remove_dots: true,
			gmail_remove_subaddress: true
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

exports.authenticate = {
	validation: [
		sanitize('username').trim(),
		sanitize('password').trim()
	],
	handler: function(req, res) {
		passport.authenticate('local', function(user, info){
			if(user){
				let token = user.generateToken();
				res.status(200).json({
					success: true,
					token: token
				});
			} else {
				res.status(401).json({
					success: false,
					info: info
				});
			}
		})(req, res);
	}
}



exports.account = {
	handler: function(req, res) {
		if (!req.payload._id) {
			res.status(401).json({
				success: false,
				info: { message: 'Unauthorized access' }
			});
		} else {
			User.findById(req.payload._id).exec(function(err, user) {
				res.status(200).json({success: true, data:user});
			});
		}
	}
}

exports.update = {
	validation: [
		sanitize('username').trim(),
		sanitize('email').trim().normalizeEmail({
			gmail_remove_dots: true,
			gmail_remove_subaddress: true
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
					
					if(req.body.username) model.username = req.body.username;
					if(req.body.email) model.email = req.body.email;
					if(req.body.password) model.password = req.body.password;

					let data = await model.save();

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
				let data = await User.findByIdAndRemove(req.payload._id);

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
