const fs = require('node:fs');
const { Client, Collection, Intents } = require('discord.js');
const { token } = require('./config.json');
const { generateCommandString, sendEphemeralMessage } = require('./utils/string-utils');
const { canUserMakeClaim } = require('./utils/database-utils');
const { handleDescriptionSelectMenu } = require('./utils/select-menu-utils');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const talkedRecently = new Set();
const MESSAGECOOLDOWN = 30000; // 30 seconds

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
	console.log('Executing Command ------------------------------------------------------------------');
	console.log('Interaction ID: ' + interaction.id);
	if (talkedRecently.has(interaction.user.id)) {
		console.log(interaction.user.username + ' used a command within the cooldown');
		sendEphemeralMessage(interaction, 'User Message Cooldown: Please Wait 30 Seconds Before Using Another Command');
		return;
	}
	talkedRecently.add(interaction.user.id);

	setTimeout(() => {
		console.log(interaction.user.username + ' can now call another command.');
		talkedRecently.delete(interaction.user.id);
	}, MESSAGECOOLDOWN);

	if (!interaction.isCommand()) {
		if (!interaction.isSelectMenu()) return;
		console.log('Select Menu Event Detected.');
		handleDescriptionSelectMenu(interaction);
		return;
	}

	console.log('Message sent in channel ' + interaction.channel.name);
	if (!interaction.channel.name.includes('nuzlocke-name-claim')) {
		console.log('Incorrectly formatted channel name.');
		sendEphemeralMessage(interaction, 'WrongChannelError: Please use this command in the "nuzlocke-name-claim" channel only.');
		return;
	}
	console.log('Channel name fits parameters. Continuing');

	console.log('Server Name: ' + interaction.guild.name);
	const rolePermissions = await canUserMakeClaim(interaction.member, interaction.guild.name);
	console.log('Returned Role Permissions: ' + rolePermissions);
	if (!rolePermissions[0] && !rolePermissions[1]) {
		return sendEphemeralMessage(interaction, 'MissingRoleError: You do not have the correct role to use these commands. If you believe you should, please contact your server\'s moderators to grant you that role.');
	}
	console.log('User is allowed to make a claim in the system');

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		console.log('Executing command: ' + generateCommandString(interaction));
		await command.execute(interaction, rolePermissions[1]);
	}
	catch (error) {
		console.error(error);
		sendEphemeralMessage(interaction, 'There was an error while executing this command!');
	}
	console.log('Command Finished Executing ------------------------------------------------------------------');
});

client.login(token);