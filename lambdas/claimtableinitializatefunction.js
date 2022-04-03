const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
	const tableName = event['table-name'];

	const scanParams = {
		ProjectionExpression: 'pokemon',
		TableName: 'PokemonEvoLinesTable',
	};

	let response = undefined;
	const pokemonList = [];
	console.log('Scanning evolution lines table with params ' + JSON.stringify(scanParams));
	await dynamodb.scan(scanParams, function(err, data) {
		if (err) {
			console.log('Error scanning items from evolution lines table', err);
			response = {
				statusCode: 500,
				body: err,
			};
		}
		else {
			console.log('Successfully got all pokemon from evolution lines table', data);
			data.Items.forEach(function(element) {
				pokemonList.push(element.pokemon);
			});
		}
	}).promise();

	if (response != undefined) {
		console.log('Error Occurred');
		return response;
	}

	console.log('Adding Default Items to Table');
	for (const index in pokemonList) {
		const pokemonName = pokemonList[index];
		const addParams = {
			TableName: tableName,
			Item: {
				'pokemon': pokemonName,
				'username': 'UNDEFINED',
				'nickname': 'UNDEFINED',
				'next-change-date': 'UNDEFINED',
				'is-permanent': false,
			},
		};

		console.log('Adding ' + pokemonName + ' to the table with params ' + JSON.stringify(addParams));
		await dynamodb.put(addParams, function(err, data) {
			if (err) {
				console.error(err);
				response = {
					statusCode: 500,
					body: err,
				};
			}
			else {
				console.log('Successfully added blank entry for ' + pokemonName + ': ' + JSON.stringify(data));
			}
		}).promise();

		if (response != undefined) {
			console.log('Error Occurred');
			break;
		}
	}

	if (response == undefined) {
		console.log('No errors detected, returning successful message');
		response = {
			statusCode: 200,
			body: 'Successfully added initiated ddb table for ' + tableName,
		};
	}

	return response;
};