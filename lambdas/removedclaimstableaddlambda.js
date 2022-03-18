const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
	const username = event['username'];
	const serverName = event['server-name'];
	const nextClaimDate = event['next-claim-date'];

	let response = undefined;
	console.log('Adding remove-claim entry for ' + username + ' for the server: ' + serverName);
	const params = {
		TableName:'RemoveClaimsTable',
		Item: {
			'username': username,
			'server-name': serverName,
			'next-claim-date': nextClaimDate,
		},
	};

	console.log('Adding entry to removed-claims database: ' + JSON.stringify(params));
	await dynamodb.put(params, function(err, data) {
		if (err) {
			console.error(err);
			response = {
				statusCode: 500,
				body: err,
			};
		}
		else {
			console.log('Successfully added removed-claim data for ' + username + ' in discord server ' + serverName + ': ' + JSON.stringify(data));
		}
	}).promise();

	if (response == undefined) {
		console.log('No errors detected, returning successful message');
		response = {
			statusCode: 200,
			body: 'Successfully added remove-claim entry for ' + username + ' in discord server ' + serverName + ' to database',
		};
	}

	return response;
};
