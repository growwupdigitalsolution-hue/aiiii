// Usage: router.post("/action", helper.verifyToken, checkRole(ROLES.SUPER_ADMIN), controller.fn)
// verifyToken hamesha checkRole se PEHLE lagega, req.user usi se set hota hai

const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        // console.log('req.user', req.user, 'req.user.role', req.user.role)
        try {
            if (!req.user || !allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    "ErrorMessage": "You do not have permission to perform this action.",
                    "data": {}
                });
            }
            next();
        } catch (error) {
            return res.status(403).json({
                "ErrorMessage": "Access denied.",
                "data": {}
            });
        }
    };
};

module.exports = { checkRole };
