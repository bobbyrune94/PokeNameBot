# Nuzlocke Name Claim 
This repository stores the code for the discord bot and lambdas portion of the Nuzlocke Name Claim System.

## Discord Bot
The discord bot allows for registered users in a discord server to claim a nickname for a pokemon evolutionary line for a streamer to use when playing a nuzlocke or other Pokemon playthrough. It interfaces with DynamoDB tables to check for registered claim roles, pokemon claim data, pokemon evolutionary lines, pokemon gender anomalies, etc.

The bot has the following commands:
- **/directions**: get usage instructions on the other commands
- **/claim**: claims a pokemon and its evolutionary line with the provided nickname
- **/view**: gives information on a user’s claim or a pokemon’s claim
- **/edit**: edits the nickname for a user’s claim (if they have one)
- **/change**: changes a user’s claim to a different pokemon (must occur > 3 months after their first claim)
- **/remove**: removes a user’s claim

## Other Scripts
- **deploy-commands.js**: used to deploy all the commands to the discord bot
- **clean-commands.js**: used to clean up discord-server-specific commands from the discord bot
- **evo-line-generator.py**: used to generate all the evolutionary line data to put into the tables. Makes calls to PokeAPI to generate the data, then includes regional forms.

Repository for the lambda code can be found here: https://github.com/bobbyrune94/NuzlockeNameClaimLambdas
