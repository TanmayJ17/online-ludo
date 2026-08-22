module.exports = function requireAdmin(req, res, next) {
    if (!req.user) {
        // shouldn't happen if isLoggedIn ran first, but guard anyway
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Admin access required"
        });
    }

    next();
};