require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/users.models');

const BOTS = [
    { username: 'Bot Red', email: 'bot.red@ludo.internal' },
    { username: 'Bot Green', email: 'bot.green@ludo.internal' },
    { username: 'Bot Yellow', email: 'bot.yellow@ludo.internal' },
    { username: 'Bot Blue', email: 'bot.blue@ludo.internal' },
];

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);

    for (const bot of BOTS) {
        const existing = await User.findOne({ email: bot.email });
        if (existing) {
            console.log(`Already exists: ${bot.username}`);
            continue;
        }

        // Bots never log in, so the password is just a random unusable placeholder —
        // it's hashed the same way a real user's would be, but nobody knows it.
        await User.create({
            username: bot.username,
            email: bot.email,
            password: Math.random().toString(36).slice(2) + Date.now(),
            isBot: true
        });
        console.log(`Created: ${bot.username}`);
    }

    await mongoose.disconnect();
    console.log('Done.');
}

seed();