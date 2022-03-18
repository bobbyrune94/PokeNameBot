const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
	const pokemon = event['pokemon'];
	console.log(JSON.stringify('Getting evolution data for ' + pokemon));
	const params = {
		TableName : 'PokemonEvoLinesTable',
		Key: {
			'pokemon': pokemon,
		},
	};

	let response;
	console.log('Searching evolution line database for following params: ' + JSON.stringify(params));
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
				console.warn(pokemon + ' is not a valid pokemon name');
				response = {
					statusCode: 404,
					body: 'UndefinedPokemonError: ' + pokemon + ' is not a claimable pokemon.',
				};
			}
			else {
				console.log('Successfully retrieved evolution data for ' + pokemon + ': ' + JSON.stringify(data));
				response = {
					statusCode: 200,
					body: data['Item']['evo-line'],
				};
			}
		}
	}).promise();

	return response;
};