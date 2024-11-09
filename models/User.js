const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    profile_picture: {
        type: String,
        default: '',
    },
    cover_photo: {
        type: String,
        default: '',
    },
    bio: {
        type: String,
        default: '',
    },
    followers: [
        {
            type: Types.ObjectId,
            ref: 'User',
        },
    ],
    following: [
        {
            type: Types.ObjectId,
            ref: 'User',
        },
    ],
    save_posts: [
        {
            type: Types.ObjectId,
            ref: 'Post',
        },
    ],
}, { 
    timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;
