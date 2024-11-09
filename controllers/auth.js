const { User } = require(`../models`)
const hashPassword = require(`../utils/hashPassword`)
const comparePassword = require(`../utils/comparePassword`)
const generateToken = require(`../utils/generateToken`)

const signup = async (req, res, next) => {
    try {
        const { 
            username, 
            email, 
            password,
            profile_picture,
            cover_photo,
            bio,
            followers,
            following,
            saved_posts 
        } = req.body;

        const isEmailExist = await User.findOne({ email });
        if (isEmailExist) {
            res.status(400).json({ code: 400, message: 'Email already exists' });
            return;
        }

        const hashedPassword = await hashPassword(password);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            profile_picture,
            cover_photo,
            bio,
            followers,
            following,
            saved_posts
        });
        await newUser.save();
        res.status(201).json({ code: 201, status: 'success', message: 'User created successfully' });    
    } catch (error) {
        next(error);
    }
};


const signin = async (req, res, next) => {
    try{
        const { email, password } = req.body
        const user = await User.findOne({email})
        if(!user) {
            res.code = 401
            throw new Error(`Invalid Credentials`) 
        }

        const match = await comparePassword(password, user.password)
        if(!match) {
            res.code = 401
            throw new Error(`Invalid Credentials`) 
        }

        const token = generateToken(user)

        res
        .status(200)
        .json({code : 200, 
            status: true, 
            message: `User logged in Successfully`, 
            data: {token}
        })
    }catch(error) {
        next(error)
    }
}

module.exports = { signup, signin }
