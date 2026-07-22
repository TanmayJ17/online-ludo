const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    number: Number,
    boardPosition: {
        type: Number,
        default: -1
    }
}, { _id: false });

function createTokens(){
    return [
        {number: 1, boardPosition: -1},
        {number: 2, boardPosition: -1},
        {number: 3, boardPosition: -1},
        {number: 4, boardPosition: -1}
    ]
}

const playerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    color: {
        type: String,
        enum: ["red", "blue", "green", "yellow"],
        required: true
    },
    rank: { 
        type: Number,
        default: 0,
        min: 0,
        maz: 4
    },
    tokens: {
        type: [tokenSchema],
        default: createTokens
    }
}, { _id: false });

const gameSchema = new mongoose.Schema({
    roomCode: {
        type: String,
        unique: true,
        required: true,
        uppercase: true
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["waiting", "playing", "finished"],
        default: "waiting"
    },
    maxPlayers: {
        type: Number,
        default: 4,
        min: 2,
        max: 4
    },
    currentTurnIndex: {
        type: Number,
        default: -1,
    },
    players: {
        type: [playerSchema],
        default: []
    },
    rankings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, {timestamps: true});

module.exports = mongoose.model('Game', gameSchema);