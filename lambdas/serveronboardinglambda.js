const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB;


exports.handler = async (event) => {
	const tableName = event['table-name'];

	const tableParams = {
		AttributeDefinitions: [
			{
				AttributeName: 'pokemon',
				AttributeType: 'S',
			},
		],
		KeySchema: [
			{
				AttributeName: 'pokemon',
				KeyType: 'HASH',
			},
		],
		ProvisionedThroughput: {
			ReadCapacityUnits: 1,
			WriteCapacityUnits: 1,
		},
		TableName: tableName,
		StreamSpecification: {
			StreamEnabled: false,
		},
	};

	let response = undefined;
	console.log('Creating New Claim Table ' + tableName + ' with params ' + JSON.stringify(tableParams));
	await dynamodb.createTable(tableParams, function(err, data) {
		if (err) {
			if (!err.toString().includes('Attempt to change a resource which is still in use')) {
				console.log('Create Table Error', err);
				response = {
					statusCode: 500,
					body: err,
				};
			}
		}
		else {
			console.log('Successfully created new claims table with name ' + tableName + ': ' + JSON.stringify(data));
		}
	}).promise();

	console.log('Waiting for Table to Finish Completing');
	await new Promise(resolve => setTimeout(resolve, 2000));
	console.log('Finished Waiting');

	if (response != undefined) {
		console.log('Error detected. Returning');
		return response;
	}

	const lambda = new AWS.Lambda();
	const initializeLambdaParams = {
		FunctionName: 'ClaimTableInitializeFunction',
		InvocationType: 'RequestResponse',
		LogType: 'Tail',
		Payload: '{ "tableName": "' + tableName + '" }',
	};

	console.log('Invoking Claim Table Initialize Function with parameters ' + JSON.stringify(initializeLambdaParams));
	await lambda.invoke(initializeLambdaParams, function(err, data) {
		if (err) {
			console.log('Lambda Invoke Error: ' + err);
		}
		else {
			console.log('Successfully initialized elements in claims table ' + tableName + ': ' + data);
		}
	}).promise();

	if (response != undefined) {
		console.log('Error detected. Returning');
		return response;
	}

	const serverName = event['server-name'];
	const claimRoles = event['claim-roles'];
	const permaClaimRoles = event['perma-claim-roles'];

	const rolesLambdaParams = {
		FunctionName: 'ClaimRolesTableAddLambda',
		InvocationType: 'RequestResponse',
		LogType: 'Tail',
		Payload: '{ "server-name": "' + serverName + '", "claim-roles": ' + JSON.stringify(claimRoles) + ', "perma-claim-roles": ' + JSON.stringify(permaClaimRoles) + ' }',
	};

	console.log('Invoking Claim Roles Add Lambda with params ' + JSON.stringify(rolesLambdaParams));
	await lambda.invoke(rolesLambdaParams, function(err, data) {
		if (err) {
			console.log('Lambda Invoke Error: ' + err);
		}
		else {
			console.log('Successfully added claim roles to the claim-roles table ' + tableName + ': ' + data);
		}
	}).promise();

	if (response != undefined) {
		return response;
	}

	return {
		statusCode: 200,
		body: 'Successfully onboarded new server',
	};

};