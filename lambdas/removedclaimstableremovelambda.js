const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
	const username = event['username'];
	const serverName = event['server-name'];

	console.log(JSON.stringify('Removing remove-claims data for ' + username + ' in server ' + serverName));
	const params = {
		TableName : 'RemoveClaimsTable',
		Key: {
			'username': username,
			'server-name': serverName,
		},
	};

	let response;
	console.log('Removing entry in removed-claims database: ' + JSON.stringify(params));
	await dynamodb.delete(params, function(err, data) {
		if (err) {
			console.error(err);
			response = {
				statusCode: 500,
				body: err,
			};
		}
		else {
			console.log('Successfully deleted remove-claims role data for ' + username + ' in server ' + serverName + ': ' + JSON.stringify(data));
			response = {
				statusCode: 200,
				body: 'Successfully deleted ' + username + '\'s remove-claim entry in server ' + serverName + ' from the database.',
			};
		}
	}).promise();

	return response;
};
