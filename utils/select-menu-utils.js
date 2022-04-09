const { logMessage } = require('./logging-utils');
const { sendEphemeralMessage, generateAllCommandInfoString, generateDirectionsCommandInfoString, generateClaimCommandInfoString,
	generateViewCommandInfoString, generateEditCommandInfoString, generateChangeCommandInfoString, generateRemoveCommandInfoString,
	generateInvalidCommandNameString, generatePokemonNameNotes } = require('./string-utils');

function handleDescriptionSelectMenu(interaction) {
	switch (interaction.values[0]) {
	case 'description':
		logMessage('Outputting usage information for the description command', interaction.id);
		sendEphemeralMessage(interaction, generateDirectionsCommandInfoString());
		break;
	case 'claim':
		logMessage('Outputting usage information for the claim command', interaction.id);
		sendEphemeralMessage(interaction, generateClaimCommandInfoString() + '\n' + generatePokemonNameNotes());
		break;
	case 'view':
		logMessage('Outputting usage information for the view command', interaction.id);
		sendEphemeralMessage(interaction, generateViewCommandInfoString() + '\n' + generatePokemonNameNotes());
		break;
	case 'edit':
		logMessage('Outputting usage information for the edit command', interaction.id);
		sendEphemeralMessage(interaction, generateEditCommandInfoString());
		break;
	case 'change':
		logMessage('Outputting usage information for the change command', interaction.id);
		sendEphemeralMessage(interaction, generateChangeCommandInfoString() + '\n' + generatePokemonNameNotes());
		break;
	case 'remove':
		logMessage('Outputting usage information for the remove command', interaction.id);
		sendEphemeralMessage(interaction, generateRemoveCommandInfoString());
		break;
	case 'showall':
		logMessage('Outputting usage information for the all commands', interaction.id);
		sendEphemeralMessage(interaction, generateAllCommandInfoString());
		break;
	default:
		logMessage('InvalidSelectionError: Unknown Command String Selected', interaction.id);
		sendEphemeralMessage(interaction, generateInvalidCommandNameString());
		break;
	}
}

module.exports = { handleDescriptionSelectMenu };