const fs = require('node:fs');
const { Client, Collection, Intents } = require('discord.js');
const { token } = require('./config.json');
const { generateCommandString, sendEphemeralMessage } = require('./utils/string-utils');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

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
	if (!interaction.isCommand()) return;

	if (interaction.channel.name != 'nuzlocke-name-claim') {
		sendEphemeralMessage(interaction, 'WrongChannelError: Please use this command in the "nuzlocke-name-claim" channel only.');
		return;
	}

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		console.log('Executing command: ' + generateCommandString(interaction));
		await command.execute(interaction);
	}
	catch (error) {
		console.error(error);
		sendEphemeralMessage(interaction, 'There was an error while executing this command!');
	}
});

client.login(token);