const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
	const serverName = event['server-name'];

	console.log(JSON.stringify('Removing Claim Role data for ' + serverName));
	const params = {
		TableName : 'ClaimRolesTable',
		Key: {
			'server-name': serverName,
		},
	};

	let response;
	console.log('Sending the following params to database: ' + JSON.stringify(params));
	await dynamodb.delete(params, function(err, data) {
		if (err) {
			console.log(err);
			response = {
				statusCode: 500,
				body: err,
			};
		}
		else {
			console.log('Successfully deleted claim role data for ' + serverName + ': ' + JSON.stringify(data));
			response = {
				statusCode: 200,
				body: 'Successfully deleted ' + serverName + '\'s claim role data from the database.',
			};
		}
	}).promise();

	return response;
};