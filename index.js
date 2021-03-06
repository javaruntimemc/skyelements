const newLocal = require('fs');
const fs = newLocal;
const Discord = require('discord.js');
const { prefix, token } = require('./config.json');

const cooldowns = new Discord.Collection();

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.once('ready', () => {
	console.log(`User : ${client.user.tag}\nTotal : ${client.users.cache.size} users, ${client.channels.cache.size} channels, ${client.guilds.cache.size} guilds`);
	client.user.setPresence({
		status: 'online',
		activity: {
			name: `${prefix}help ∙ ${client.users.cache.size} users, ${client.channels.cache.size} channels, ${client.guilds.cache.size} guilds`,
			type: 'PLAYING'
		}
	});
});

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	const command = client.commands.get(commandName);

	/* ============================================= */

	if (!command) return;

	if (command.guildOnly && message.channel.type === 'dm') {
		return message.channel.send('Error: I can\'t execute that command inside DMs!');
	}

	if (command.args && !args.length) {
		let reply = `You didn't provide any arguments, ${message.author}!`;

		if (command.usage) {
			reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
		}

		return message.channel.send(reply);
	}

	/* ============================================= */

	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 3) * 1000;

	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return message.channel.send(`Error: Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
		}
	}

	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

	/* ============================================= */

	try {
		command.execute(message, args);
	}
	catch (error) {
		console.error(error);
		message.channel.send('Error: There was a problem trying to execute that command!');
	}
});

client.login(token);