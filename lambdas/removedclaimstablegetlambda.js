const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
	const username = event['username'];
	const serverName = event['server-name'];

	console.log(JSON.stringify('Getting Remove Claims data for ' + username + ' in server ' + serverName));
	const params = {
		TableName : 'RemoveClaimsTable',
		Key: {
			'username': username,
			'server-name': serverName,
		},
	};

	let response;
	console.log('Getting entry in removed-claims database: ' + JSON.stringify(params));
	await dynamodb.get(params, function(err, data) {
		if (err) {
			console.error(err);
			response = {
				statusCode: 500,
				body: err,
			};
		}
		else {
			if (data['Item'] == undefined) {
				console.warn('No entry found');
				response = {
					statusCode: 404,
					body: 'NoEntryFoundError: there wasn\'t an entry found for ' + username + ' in server ' + serverName,
				};
			}
			else {
				console.log('Successfully retrieved remove claim data for ' + username + ' in server ' + serverName + ': ' + JSON.stringify(data));
				response = {
					statusCode: 200,
					body: data['Item']['next-claim-date'],
				};
			}
		}
	}).promise();

	return response;
};
