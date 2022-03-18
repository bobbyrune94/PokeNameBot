const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
	const tableName = event['table-name'];
	const pokemon = event['pokemon'];
	const username = event['username'];
	const nickname = event['nickname'];
	const nextChangeDate = event['next-change-date'];
	const isPermanent = event['is-permanent'];

	console.log(JSON.stringify('Adding Claim data for ' + pokemon + ' in ' + tableName));
	const params = {
		TableName: tableName,
		Item: {
			'pokemon': pokemon,
			'username': username,
			'nickname': nickname,
			'next-change-date': nextChangeDate,
			'is-permanent': isPermanent,
		},
	};

	let response;
	console.log('Sending the following params to database: ' + JSON.stringify(params));
	await dynamodb.put(params, function(err, data) {
		if (err) {
			console.log(err);
			response = {
				statusCode: 500,
				body: err,
			};
		}
		else {
			console.log('Successfully added claim data for ' + pokemon + ' in claim table ' + tableName + ': ' + JSON.stringify(data));
			response = {
				statusCode: 200,
				body: 'Successfully added claim for ' + pokemon + ' in server ' + tableName + ' for ' + username,
			};
		}
	}).promise();

	return response;
};
