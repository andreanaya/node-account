exports.notification = function(type, message) {
	return 'notification='+encodeURIComponent(
		JSON.stringify({
			type: type,
			message: message

		})
	)
}

exports.notificationParser = (req, res, next) => {
	if(req.query.notification) {
		try {
			let notification = JSON.parse(decodeURIComponent(req.query.notification));
			req.notification = notification;
			next();
		} catch(e) {
			next();
		}
	} else {
		next();
	}
}