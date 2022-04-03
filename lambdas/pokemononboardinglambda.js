/* eslint-disable no-constant-condition */
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();
const ddbTable = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();

exports.handler = async (event) => {
	const newEvoLines = event['evolution-lines'];
	const newGenderEvos = event['gender-anomalies'];

	let response = undefined;
	const addLinesParams = {
		FunctionName: 'PokemonEvoLineTableAddLambda',
		InvocationType: 'RequestResponse',
		LogType: 'Tail',
		Payload: JSON.stringify(newEvoLines),
	};

	console.log('Invoking Add Evolution Lines Lambda with parameters ' + JSON.stringify(addLinesParams));
	await lambda.invoke(addLinesParams, function(err, data) {
		if (err) {
			console.log('Lambda Invoke Error: ' + err);
			response = {
				statusCode: 500,
				body: err,
			};
		}
		else {
			console.log('Successfully added new evolution lines: ' + JSON.stringify(data));
		}
	}).promise();

	if (response != undefined) {
		console.log('Error detected. Exiting');
		return response;
	}

	const anomalyParams = {
		FunctionName: 'PokemonGenderAnomalyTableAddLambda',
		InvocationType: 'RequestResponse',
		LogType: 'Tail',
		Payload: JSON.stringify(newGenderEvos),
	};

	console.log('Invoking Add Gender Anomalies Lambda with parameters ' + JSON.stringify(anomalyParams));
	await lambda.invoke(anomalyParams, function(err, data) {
		if (err) {
			console.log('Lambda Invoke Error: ' + err);
			response = {
				statusCode: 500,
				body: err,
			};
		}
		else {
			console.log('Successfully added new gender anomalies: ' + JSON.stringify(data));
		}
	}).promise();

	if (response != undefined) {
		console.log('Error detected. Exiting');
		return response;
	}

	const listTableParams = {};
	const claimTables = [];

	console.log('Getting Claim Tables');
	while (true) {
		const listTablesResponse = await dynamodb.listTables(listTableParams).promise();
		for (const index in listTablesResponse.TableNames) {
			const tableName = listTablesResponse.TableNames[index];
			console.log('Checking if ' + tableName + ' is a claims table');
			if (tableName.includes('ClaimsTable') && tableName != 'RemoveClaimsTable') {
				console.log(tableName + ' is a claim table');
				claimTables.push(tableName);
			}
		}

		if (undefined === listTablesResponse.LastEvaluatedTableName) {
			break;
		}
		else {
			listTableParams.ExclusiveStartTableName = listTablesResponse.LastEvaluatedTableName;
		}
	}

	console.log('Waiting for Tables List to Finish');
	await new Promise(resolve => setTimeout(resolve, 2000));
	console.log('Finished Waiting');

	console.log('Claim Tables Found: ' + JSON.stringify(claimTables));

	console.log('Adding new pokemon to claim tables');
	for (const tableIndex in claimTables) {
		const claimTableName = claimTables[tableIndex];
		console.log('Adding new pokemon to ' + claimTableName);
		for (const pokemon in newEvoLines) {
			const addParams = {
				TableName: claimTableName,
				Item: {
					'pokemon': pokemon,
					'username': 'UNDEFINED',
					'nickname': 'UNDEFINED',
					'next-change-date': 'UNDEFINED',
					'is-permanent': false,
				},
			};

			console.log('Adding ' + pokemon + ' to the ' + claimTableName + ' table with params ' + JSON.stringify(addParams));
			await ddbTable.put(addParams, function(err, data) {
				if (err) {
					console.error(err);
					response = {
						statusCode: 500,
						body: err,
					};
				}
				else {
					console.log('Successfully added blank entry for ' + pokemon + ' in ' + claimTableName + ': ' + JSON.stringify(data));
				}
			}).promise();

			if (response != undefined) {
				console.log('Error Occurred');
				break;
			}
		}
		if (response != undefined) {
			break;
		}
	}

	if (response != undefined) {
		return response;
	}

	return {
		statusCode: 200,
		body: 'Successfully onboarded new pokemon',
	};
};