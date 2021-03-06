const fs = require('node:fs');
const { Client, Collection, Intents } = require('discord.js');
const { token } = require('./config.json');
const { generateCommandString, sendEphemeralMessage } = require('./utils/string-utils');
const { canUserMakeClaim } = require('./utils/database-utils');
const { logMessage } = require('./utils/logging-utils.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const talkedRecently = new Set();
const MESSAGECOOLDOWN = 15000; // 15 seconds
const CHANNELNAMEREQUIREMENT = 'poke-name-claim';

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

client.once('ready', () => {
	console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
	logMessage('Interaction triggered from user ' + interaction.user.username, interaction.id);
	if (!interaction.isCommand()) {
		if (!interaction.isSelectMenu()) return;
	}

	if (talkedRecently.has(interaction.user.id)) {
		logMessage(interaction.user.username + ' used a command within the cooldown', interaction.id);
		sendEphemeralMessage(interaction, 'User Message Cooldown: Please Wait ' + Math.round(MESSAGECOOLDOWN / 1000) + ' Seconds Before Using Another Command');
		return;
	}

	logMessage('Message sent in channel ' + interaction.channel.name, interaction.id);
	if (!interaction.channel.name.includes(CHANNELNAMEREQUIREMENT)) {
		logMessage('Incorrectly formatted channel name.', interaction.id);
		sendEphemeralMessage(interaction, 'WrongChannelError: Please use this command in the "' + CHANNELNAMEREQUIREMENT + '" channel only.');
		return;
	}
	logMessage('Channel name fits parameters. Continuing', interaction.id);

	logMessage('Server Name: ' + interaction.guild.name, interaction.id);
	const rolePermissions = await canUserMakeClaim(interaction.member, interaction.guild.name, interaction.id);
	logMessage('Returned Role Permissions: ' + rolePermissions, interaction.id);
	if (!rolePermissions[0] && !rolePermissions[1]) {
		return sendEphemeralMessage(interaction, 'MissingRoleError: You do not have the correct role to use these commands. If you believe you should, please contact your server\'s moderators to grant you that role.');
	}
	logMessage('User is allowed to make a claim in the system', interaction.id);

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		const commandString = generateCommandString(interaction);
		logMessage('Executing command: ' + commandString, interaction.id);

		if (!commandString.includes('/directions')) {
			interaction.deferReply({ ephemeral: true }).catch(err => {
				logMessage('Error Deferring Reploy: ' + err.toString(), interaction.id);
			});

			logMessage(interaction.user.username + ' is now on cooldown. Please wait ' + Math.round(MESSAGECOOLDOWN / 1000) + ' seconds before calling another command', interaction.id);
			talkedRecently.add(interaction.user.id);

			setTimeout(() => {
				logMessage(interaction.user.username + ' can now call another command.', interaction.id);
				interaction.followUp({
					content: 'You may now call another command. If your previous command didn\'t respond, feel free to try it again. If you made a claim or an edit, it likely went through, but had an error returning the result.',
					ephemeral: true,
				});
				talkedRecently.delete(interaction.user.id);
			}, MESSAGECOOLDOWN);
		}
		await command.execute(interaction, rolePermissions[1]);
	}
	catch (error) {
		console.error(error);
		sendEphemeralMessage(interaction, 'There was an error while executing this command!');
	}
});

client.login(token);