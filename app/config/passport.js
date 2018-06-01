const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User');

passport.use(new LocalStrategy({
		usernameField: 'username'
	},
	function(username, password, done) {
		User.findOne({ username: username }, function (err, user) {
			if (err) { return done(err); }
			// Return if user not found in database
			if (!user) {
				return done(null, false, {
					sucess: false,
					message: 'User not found'
				});
			}
			// Return if password is wrong
			if (!user.validatePassword(password)) {
				return done(null, false, {
					sucess: false,
					message: 'Incorrect password'
				});
			}
			// If credentials are correct, return the user object
			return done(null, user);
		});
	}
));