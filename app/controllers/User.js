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
				email: req.body.email
			});

			model.setPassword(req.body.password);

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
		passport.authenticate('local', function(err, user, info){
			if (err) {
				res.status(404).json(err);
				return;
			}

			if(user){
				let token = user.generateToken();
				res.status(200);
				res.json({
					success: true,
					token: token
				});
			} else {
				res.status(401).json(info);
			}
		})(req, res);
	}
}