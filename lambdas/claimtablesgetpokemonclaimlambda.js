const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
	const tableName = event['table-name'];
	const pokemon = event['pokemon'];
	console.log(JSON.stringify('Getting Claim data for ' + pokemon + ' in ' + tableName));
	// Create JSON object with parameters for DynamoDB and store in a variable
	const params = {
		TableName: tableName,
		Key: {
			'pokemon': pokemon,
		},
	};

	let response;
	console.log('Searching table with following params: ' + JSON.stringify(params));
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
				console.warn('Invalid Pokemon Name: ' + pokemon + ' is not a valid pokemon name');
				response = {
					statusCode: 404,
					body: 'InvalidPokemonError: ' + pokemon + ' is not a valid Pokemon name.',
				};
			}
			else {
				console.log('Successfully retrieved claim data for ' + pokemon + ' in claim table ' + tableName + ': ' + JSON.stringify(data));
				response = {
					statusCode: 200,
					body: data['Item'],
				};
			}
		}
	}).promise();

	return response;
};
