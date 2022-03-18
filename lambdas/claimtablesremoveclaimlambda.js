const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
	const tableName = event['table-name'];
	const pokemon = event['pokemon'];

	console.log(JSON.stringify('Removing Claim for ' + pokemon + ' in table ' + tableName));
	const params = {
		TableName: tableName,
		Item: {
			'pokemon': pokemon,
			'username': 'UNDEFINED',
			'nickname': 'UNDEFINED',
			'next-change-date': 'UNDEFINED',
			'is-permanent': false,
		},
	};

	let response;
	console.log('Removing claim data with following params: ' + JSON.stringify(params));
	await dynamodb.put(params, function(err, data) {
		if (err) {
			console.log(err);
			response = {
				statusCode: 500,
				body: err,
			};
		}
		else {
			console.log('Successfully removed claim data for ' + pokemon + ' in claim table ' + tableName + ': ' + JSON.stringify(data));
		}
	}).promise();

	if (response == undefined) {
		console.log('No Errors Detected. Remove Function Successful.');
		response = {
			statusCode: 200,
			body: 'Successfully removed claim for ' + pokemon + ' in table ' + tableName,
		};
	}

	return response;
};