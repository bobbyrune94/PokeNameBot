const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
	const pokemon = event['pokemon'];
	console.log(JSON.stringify('Getting Gender Anomaly Data for ' + pokemon));
	const params = {
		TableName : 'PokemonGenderAnomalyTable',
		Key: {
			'pokemon': pokemon,
		},
	};

	let response;
	console.log('Searching gender anomaly database for following params: ' + JSON.stringify(params));
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
				console.log(pokemon + ' doesn\'t have a gender anomaly.');
				response = {
					statusCode: 404,
					body: 'two_gendered',
				};
			}
			else {
				console.log('Successfully retrieved gender anomaly data for ' + pokemon + ': ' + JSON.stringify(data));
				response = {
					statusCode: 200,
					body: data['Item']['gender-anomaly'],
				};
			}
		}
	}).promise();

	return response;
};
