const User = require('../models/users.models');
const {generateToken} = require('../auth/jwt');

module.exports.registerUser = async (req, res, next) => {
    const {username, password, email, profileImage} = req.body;


    if(!username || !password || !email){
        return res.status(400).json({
            message: "All fields are required"
        })
    }

    try {

        const usernameExists = await User.findOne({username});
        if(usernameExists){
            return res.status(400).json({
                message: "username already exits"
            })
        }

        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        const user = await User.create({
            username,
            password,
            email,
            profileImage
        })

        const token = generateToken(user._id);

        res.status(201).json({
            message: "User created successfully",
            token,
            user:{
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                role: user.role,
                stats: user.stats
            }
        })
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error
        })
    }
}

module.exports.loginUser = async (req, res, next) => {
    let {email, password} = req.body;

    if(!email || !password){
        return res.status(400).json({
            message: "Please fill all required fields"
        })
    }

    try {
        
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        const isMatch = await user.comparePassword(password);
        if(!isMatch){
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        const token = generateToken(user._id);
        res.status(200).json({
            message: "Login Success",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                role: user.role,
                stats: user.stats
            }
        })
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error
        })
    }
}