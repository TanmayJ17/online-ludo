const { verifyToken } = require('../auth/jwt');
const User = require('../models/users.models');

module.exports = async function socketAuth(socket, next) {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;

        if (!token) {
            return next(new Error("Unauthorized: no token provided"));
        }

        const decoded = verifyToken(token);
        const { id } = decoded;

        const user = await User.findById(id);
        if (!user) {
            return next(new Error("Unauthorized: user not found"));
        }

        socket.user = user;
        next();
    } catch (error) {
        next(new Error("Unauthorized: invalid token"));
    }
};