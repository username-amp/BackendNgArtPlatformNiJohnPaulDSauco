const { User } = require(`../models`)
const hashPassword = require(`../utils/hashPassword`)
const comparePassword = require(`../utils/comparePassword`)
const generateToken = require(`../utils/generateToken`)
const generateCode = require(`../utils/generateCode`)
const sendEmail = require(`../utils/sendEmail`)
// signup controller
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

// sign in controller
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
       res.cookie('token', token, { httpOnly: true, secure: true})
        res
        .status(200)
        .json({code : 200, 
            status: true, 
            message: `User logged in Successfully`, 
          //  data: { token }
        })
    }catch(error) {
        next(error)
    }
};

// verify code controller
const verifyCode = async (req, res, next) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email });

        if(!user) {
            res.code = 401
            throw new Error(`User not found`)
        };

        if(user.isVerified) {
            res.code = 400
            throw new Error(`User already verified`)
        }

        const code = generateCode(6)

        user.verificationCode = code
        await user.save()

        await sendEmail({
            emailTo: user.email,
            subject: `Email Verification Code`,
            code,
            content: `Verify your account`
        })

        // send email
        res.status(200)
        .json({
            code: 200, 
            status: true, 
            message: `User verified successfully`
        })

    }catch(error) {
        next(error)
    }
};

// verify user controller
const verifyUser = async (req, res, next) => {
    try {
        const { email, code } = req.body;

        const user = await User.findOne({ email });
        if(!user) {
            res.code = 404;
            throw new Error(`User Not Found`)
        }

        if(user.verificationCode !== code) {
            res.code = 400;
            throw new Error(`Invalid Verification Code`)
        }

        user.isVerified = true;
        user.verificationCode = null
        await user.save();

        res.status(200).json({
            code: 200,
            status: true,
            message: `User Verified Successfully`
        });
    }catch(error) {
        next(error)
    }
};

// forgot password controller
const forgotPasswordCode =  async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if(!user) {
            res.code = 404;
            throw new Error(`User Not Found`)
        }

        const code = generateCode(6);

        user.forgotPasswordCode = code;
        await user.save();

        await sendEmail({
            emailTo: user.email,
            subject: `Forgot Password Code`,
            code,
            content: `change your password`
        });

        res.status(200).json({
            code: 200, 
            status: true, 
            message: `Forgot Password Code Sent Successfully`
        });
    }catch(error){
        next(error)
    }
}

module.exports = { signup, signin, verifyCode, verifyUser, forgotPasswordCode }
