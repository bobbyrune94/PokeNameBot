const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
	const tableName = event['table-name'];
	const username = event['username'];

	console.log(JSON.stringify('Getting Claim data for ' + username + ' in ' + tableName));
	const params = {
		TableName: tableName,
		FilterExpression: 'username = :user',
		ExpressionAttributeValues: {
			':user': username,
		},
	};

	let response;
	console.log('Scanning table with following params: ' + JSON.stringify(params));
	await dynamodb.scan(params, function(err, data) {
		if (err) {
			console.log(err);
			response = {
				statusCode: 500,
				body: err,
			};
		}
		else {
			if (data['Items'].length == 0) {
				console.log('User Not Found: ' + username + ' has not made a claim in the database');
				response = {
					statusCode: 404,
					body: 'NoClaimError: ' + username + ' has not made a claim yet.',
				};
			}
			else {
				console.log('Successfully retrieved claim data for ' + username + ' in claim table ' + tableName + ': ' + JSON.stringify(data));
				response = {
					statusCode: 200,
					body: data['Items'],
				};
			}
		}
	}).promise();

	return response;
};
