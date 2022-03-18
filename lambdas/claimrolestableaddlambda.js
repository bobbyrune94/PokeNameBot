const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
	const serverName = event['server-name'];
	const claimRoles = event['claim-roles'];
	const permaClaimRoles = event['perma-claim-roles'];

	let response = undefined;
	console.log('Adding claim roles for the server: ' + serverName);
	const params = {
		TableName:'ClaimRolesTable',
		Item: {
			'server-name': serverName,
			'claim-roles': claimRoles,
			'perma-claim-roles': permaClaimRoles,
		},
	};

	console.log('Adding entry to claim roles database: ' + JSON.stringify(params));
	await dynamodb.put(params, function(err, data) {
		if (err) {
			console.error(err);
			response = {
				statusCode: 500,
				body: err,
			};
		}
		else {
			console.log('Successfully added claim roles data for ' + serverName + ': ' + JSON.stringify(data));
		}
	}).promise();

	if (response == undefined) {
		console.log('No errors detected, returning successful message');
		response = {
			statusCode: 200,
			body: 'Successfully added claim roles entry for discord server ' + serverName + ' to database',
		};
	}

	return response;
};
