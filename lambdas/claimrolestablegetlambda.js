const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
	const serverName = event['server-name'];

	console.log(JSON.stringify('Getting Claim Role data for ' + serverName));
	const params = {
		TableName : 'ClaimRolesTable',
		Key: {
			'server-name': serverName,
		},
	};

	let response;
	console.log('Sending the following params to database: ' + JSON.stringify(params));
	await dynamodb.get(params, function(err, data) {
		if (err) {
			console.log(err);
			response = {
				statusCode: 500,
				body: err,
			};
		}
		else {
			if (data['Item'] == undefined) {
				console.log('No claim role data found for server ' + serverName);
				response = {
					statusCode: 404,
					body: 'NoServerFoundError: ' + serverName + ' is not a registered discord server.',
				};
			}
			else {
				console.log('Successfully retrieved claim role data for ' + serverName + ': ' + JSON.stringify(data));
				response = {
					statusCode: 200,
					body: {
						'server-name': serverName,
						'claim-roles': data['Item']['claim-roles'],
						'perma-claim-roles': data['Item']['perma-claim-roles'],
					},
				};
			}
		}
	}).promise();

	return response;
};