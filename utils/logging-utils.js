function logMessage(message, interactionId) {
	console.log(new Date(Date.now()).toUTCString() + ' (Interaction ID: ' + interactionId + '): ' + message);
}

module.exports = { logMessage };