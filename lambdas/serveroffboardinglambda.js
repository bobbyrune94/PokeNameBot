const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB;
const lambda = new AWS.Lambda();

exports.handler = async (event) => {
	const tableName = event['table-name'];

	const deleteTableParams = {
		TableName: tableName,
	};

	let response = undefined;
	console.log('Deleting Claim Table ' + tableName + ' with params ' + JSON.stringify(deleteTableParams));
	await dynamodb.deleteTable(deleteTableParams, function(err, data) {
		if (err) {
			if (!err.toString().includes('Attempt to change a resource which is still in use')) {
				console.log('Delete table error: ' + err);
				response = {
					statusCode: 500,
					body: err,
				};
			}
		}
		else {
			console.log('Successfully deleted claims table with name ' + tableName + ': ' + JSON.stringify(data));
		}
	}).promise();

	console.log('Waiting for Table to Finish Deleting');
	await new Promise(resolve => setTimeout(resolve, 2000));
	console.log('Finished Waiting');

	if (response != undefined) {
		console.log('Error detected. Returning');
		return response;
	}

	const serverName = event['server-name'];
	const removeRolesParams = {
		FunctionName: 'ClaimRolesTableRemoveLambda',
		InvocationType: 'RequestResponse',
		LogType: 'Tail',
		Payload: '{ "server-name": "' + serverName + '" }',
	};

	console.log('Invoking Claim Role Remove Lambda with parameters ' + JSON.stringify(removeRolesParams));
	await lambda.invoke(removeRolesParams, function(err, data) {
		if (err) {
			console.log('Lambda Invoke Error: ' + err);
		}
		else {
			console.log('Successfully removed claim role for ' + serverName + ': ' + JSON.stringify(data));
		}
	}).promise();

	if (response != undefined) {
		console.log('Error detected. Returning');
		return response;
	}

	console.log(JSON.stringify('Getting remove-claim data for ' + serverName));
	const scanParams = {
		TableName: 'RemoveClaimsTable',
		FilterExpression: '#s = :server',
		ExpressionAttributeNames: {
			'#s': 'server-name',
		},
		ExpressionAttributeValues: {
			':server': { S: serverName },
		},
	};

	console.log('Scanning table with following params: ' + JSON.stringify(scanParams));
	await dynamodb.scan(scanParams, function(err, scanData) {
		if (err) {
			console.log(err);
			response = {
				statusCode: 500,
				body: err,
			};
		}
		else {
			if (scanData.Items.length == 0) {
				console.log('No remove-claim data found for server name ' + serverName);
			}
			else {
				console.log('Successfully retrieved claim data for ' + serverName + ': ' + JSON.stringify(scanData));
				for (const index in scanData.Items) {
					const username = scanData.Items[index]['username']['S'];
					const removeLambdaParams = {
						FunctionName: 'RemovedClaimsTableRemoveLambda',
						InvocationType: 'RequestResponse',
						LogType: 'Tail',
						Payload: '{ "username": "' + username + '",  "server-name": "' + serverName + '" }',
					};

					console.log('Invoking Remove-Claims Table Remove Entry Function with parameters ' + JSON.stringify(removeLambdaParams));
					lambda.invoke(removeLambdaParams, function(err, data) {
						if (err) {
							console.log('Lambda Invoke Error: ' + err);
						}
						else {
							console.log('Successfully removed element from remove-claims table: ' + JSON.stringify(data));
						}
					}).promise();
				}
			}
		}
	}).promise();

	console.log('Waiting for Lambdas to Finish');
	await new Promise(resolve => setTimeout(resolve, 2000));
	console.log('Finished Waiting');

	if (response != undefined) {
		console.log('Error detected');
		return response;
	}

	return {
		statusCode: 200,
		body: 'Successfully offboarded server',
	};
};