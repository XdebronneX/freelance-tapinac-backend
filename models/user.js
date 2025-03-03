const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    middleName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    suffix: {
        type: String,
    },
    username: {
        type: String,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        }
    },
    role: {
        type: String,
        default: 'teacher'
    },
    softDelete: {
        type: Boolean,
        default: false,
        index: true
    },
    deletedAt: {
        type: Date,
        default: null
    },
    restoredAt: {
        type: Date,
        default: null
    },
    deletedBy: {
        fullname: {
            type: String,
        },
        role: {
            type: String,
        }
    },
    restoredBy: {
        fullname: {
            type: String,
        },
        role: {
            type: String,
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
});

userSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    });
};

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

    return resetToken;
};

// Pre-save middleware to handle username and password hashing
userSchema.pre('save', async function (next) {
    if (!this.username) {
        this.username = `${this.firstName.toLowerCase()}.${ this.lastName.toLowerCase()}`;
    }

    if (!this.isModified('password')) {
        return next();
    }
    const saltRounds = parseInt(process.env.SALT_ROUNDS);

    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
});


module.exports = mongoose.model('User', userSchema);
