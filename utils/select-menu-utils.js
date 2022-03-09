const { sendEphemeralMessage, generateAllCommandInfoString, generateDirectionsCommandInfoString, generateClaimCommandInfoString,
	generateViewCommandInfoString, generateEditCommandInfoString, generateChangeCommandInfoString, generateRemoveCommandInfoString,
	generateInvalidCommandNameString, generatePokemonNameNotes } = require('./string-utils');

function handleDescriptionSelectMenu(interaction) {
	switch (interaction.values[0]) {
	case 'description':
		console.log('Outputting usage information for the description command');
		sendEphemeralMessage(interaction, generateDirectionsCommandInfoString());
		break;
	case 'claim':
		console.log('Outputting usage information for the claim command');
		sendEphemeralMessage(interaction, generateClaimCommandInfoString() + '\n' + generatePokemonNameNotes());
		break;
	case 'view':
		console.log('Outputting usage information for the view command');
		sendEphemeralMessage(interaction, generateViewCommandInfoString() + '\n' + generatePokemonNameNotes());
		break;
	case 'edit':
		console.log('Outputting usage information for the edit command');
		sendEphemeralMessage(interaction, generateEditCommandInfoString());
		break;
	case 'change':
		console.log('Outputting usage information for the change command');
		sendEphemeralMessage(interaction, generateChangeCommandInfoString() + '\n' + generatePokemonNameNotes());
		break;
	case 'remove':
		console.log('Outputting usage information for the remove command');
		sendEphemeralMessage(interaction, generateRemoveCommandInfoString());
		break;
	case 'showall':
		console.log('Outputting usage information for the all commands');
		sendEphemeralMessage(interaction, generateAllCommandInfoString());
		break;
	default:
		console.error('InvalidSelectionError: Unknown Command String Selected');
		sendEphemeralMessage(interaction, generateInvalidCommandNameString());
		break;
	}
}

module.exports = { handleDescriptionSelectMenu };