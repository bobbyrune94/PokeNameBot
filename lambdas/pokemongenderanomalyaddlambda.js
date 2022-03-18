const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
	let response = undefined;
	for (const anomalyType in event) {
		console.log(JSON.stringify('Adding all pokemon with anomaly ' + anomalyType));

		for (const index in event[anomalyType]) {
			const pokemon = event[anomalyType][index];
			console.log('Adding Anomaly for ' + pokemon + ': ' + anomalyType);
			const params = {
				TableName:'PokemonGenderAnomalyTable',
				Item: {
					'pokemon': pokemon,
					'gender-anomaly': anomalyType,
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
					console.log('Successfully added gender anomaly data for ' + pokemon + ': ' + JSON.stringify(data));
				}
			}).promise();

			if (response != undefined) {
				console.log('Error Detected. Exiting');
				break;
			}
		}
	}

	if (response == undefined) {
		console.log('No errors detected, returning successful message');
		response = {
			statusCode: 200,
			body: 'Successfully added pokemon gender anomalies to database',
		};
	}

	return response;
};