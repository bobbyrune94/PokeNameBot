const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
	let response = undefined;
	for (const pokemon in event) {
		const evoLine = event[pokemon];

		console.log(JSON.stringify('Successfully added evolution line for ' + pokemon + ': ' + evoLine + '\n'));
		const params = {
			TableName:'PokemonEvoLinesTable',
			Item: {
				'pokemon': pokemon,
				'evo-line': evoLine,
			},
		};

		console.log('Adding entry to evolution lines database: ' + JSON.stringify(params));
		await dynamodb.put(params, function(err, data) {
			if (err) {
				console.error(err);
				response = {
					statusCode: 500,
					body: err,
				};
			}
			else {
				console.log('Successfully added evolution data for ' + pokemon + ': ' + JSON.stringify(data));
			}
		}).promise();

		if (response != undefined) {
			console.log('Error Detected. Exiting');
			break;
		}
	}

	if (response == undefined) {
		console.log('No errors detected, returning successful message');
		response = {
			statusCode: 200,
			body: 'Successfully added evolution lines to database',
		};
	}

	return response;
};