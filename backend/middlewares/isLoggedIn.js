const User = require('../models/users.models');
const { verifyToken } = require('../auth/jwt');

function getTokenFromAuthHeader(req) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    return authHeader.split(" ")[1];
}

module.exports = async function requireAuth(req, res, next) {
    const token = getTokenFromAuthHeader(req);
    if(!token){
        return res.status(401).json({
            message: "Unauthorized"
        })
    }

    try {

        var decoded = verifyToken(token);
        const {id} = decoded;
        if(!id){
            return res.status(401).json({
                message: "Invalid JWT"
            })
        }

        const user = await User.findById(id);
        if(!user){
            return res.status(401).json({
                message: "User not found, JWT error"
            })
        }

        req.user = user;
        return next();
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error
        })
    }
    
};