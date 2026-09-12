const jwt = require('jsonwebtoken');
require('dotenv').config();

const authTokenKey = process.env.AUTH_TOKENE_KEY
const refreshTokenKey = process.env.REFRESH_TOKEN_KEY
const authTokenExpaireTime = process.env.AUTH_TOKEN_EXPAIRETIME
const refreshTokenExpaireTime = process.env.REFRESH_TOKEN_EXPAIRETIME


const generateToken = (param) => {
    if (param) {
        let authobj = {
            "_id": param._id,
            "name": param.name,
            "role": param.role,
            "mobileCode": param.mobileCode,
            "mobileNo": param.mobileNo
        };
        let authToken = jwt.sign(authobj, authTokenKey, { expiresIn: authTokenExpaireTime });
        let refreshToken = jwt.sign(authobj, refreshTokenKey, { expiresIn: refreshTokenExpaireTime });

        return { authToken, refreshToken };
    } else {
        return false;
    }
}

// verify karne k baad req.user set kar deta hai, controllers me dobara decode
// karne ki zarurat nahi padti
const verifyToken = (req, res, next) => {
    let bearerHerder = req.headers['authorization'];
    try {
        if (bearerHerder) {
            let bearer = bearerHerder.split(' ');
            let bearertoken = bearer[1];

            var bearerdetails = jwt.verify(bearertoken, authTokenKey)

            if (bearerdetails && bearerdetails._id) {
                req.user = bearerdetails;
                next();
            } else {
                return res.status(401).json({ "ErrorMessage": "access denied.", "Succeeded": false });
            }
        } else {
            return res.status(401).json({ "ErrorMessage": "access denied.", "Succeeded": false });
        }
    } catch (error) {
        return res.status(401).json({ "ErrorMessage": "access denied.", "Succeeded": false });
    }
}

const refreshToken = (req, res) => {
    let { token } = req.body;
    try {
        if (token) {
            var bearerdetails = jwt.verify(token, refreshTokenKey)

            let authobj = {
                "_id": bearerdetails._id,
                "name": bearerdetails.name,
                "role": bearerdetails.role,
                "mobileCode": bearerdetails.mobileCode,
                "mobileNo": bearerdetails.mobileNo
            };
            let authToken = jwt.sign(authobj, authTokenKey, { expiresIn: authTokenExpaireTime });

            return res.status(200).json({
                "ErrorMessage": "Successfully",
                "token": { authToken: authToken, refreshToken: token }
            })
        } else {
            return res.status(401).json({ "ErrorMessage": "access denied. 01", "Succeeded": false });
        }
    } catch (error) {
        return res.status(401).json({ "ErrorMessage": "access denied. 02", "Succeeded": false });
    }
}

const decodedToken = (token) => {
    if (token) return jwt.decode(token);
}

module.exports = { generateToken, verifyToken, refreshToken, decodedToken }
