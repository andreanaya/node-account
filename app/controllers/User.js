const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');
const { password } = require('../utils/RegExp');

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
	handler: (req, res) => {
		let errors = validationResult(req);

		if(errors.isEmpty()) {
			res.status(200).json({
				success: true
			});
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