const UserModel = require("../models/user");
const ErrorHandler = require("../utils/errorHandler");
const sendToken = require("../utils/jwtToken");
const bcrypt = require("bcrypt");
const mongoose = require('mongoose');
const cloudinary = require("cloudinary")

exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return next(new ErrorHandler("Please provide username and password", 400));
        }

        const user = await UserModel.findOne({ username }).select("+password");

        if (!user) {
            return next(new ErrorHandler("Invalid Username or Password", 401));
        }

        if (user.softDelete) {
            return next(new ErrorHandler("You don't have access!", 403));
        }

        const isPasswordMatched = await bcrypt.compare(password, user.password);

        if (!isPasswordMatched) {
            return next(new ErrorHandler("Invalid Username or Password", 401));
        }

        sendToken(user, 200, res);
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("An error occurred during login", 500));
    }
};

exports.getProfile = async (req, res, next) => {
    try {
        const user = await UserModel.findById(req.user.id).select("-password -username");

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const newUserData = {
            firstName: req.body.firstName,
            middleName: req.body.middleName,
            lastName: req.body.lastName,
            suffix: req.body.suffix,
        };

        if (req.body.avatar) {
            const user = await UserModel.findById(req.user.id);

            if (user.avatar && user.avatar.public_id) {
                const image_id = user.avatar.public_id;

                await cloudinary.v2.uploader.destroy(image_id);
            }

            const uploadResult = await cloudinary.v2.uploader.upload(
                req.body.avatar,
                {
                    folder: "avatars",
                    width: 150,
                    crop: "scale",
                }
            );

            newUserData.avatar = {
                public_id: uploadResult.public_id,
                url: uploadResult.secure_url,
            };
        }

        const user = await UserModel.findByIdAndUpdate(req.user.id, newUserData, {
            new: true,
            runValidators: true,
        }).select("-password -username -role");

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Error:", error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

//** Super admin */
exports.addUser = async (req, res, next) => {
    try {
        const { firstName, lastName, middleName, suffix, password, role } = req.body;

        const requiredFields = { firstName, lastName, middleName, password, role };
        const missingFields = [];

        for (const [field, value] of Object.entries(requiredFields)) {
            if (!value) {
                missingFields.push(field);
            }
        }

        if (missingFields.length > 0) {
            return next(new ErrorHandler(`Please provide the following field/s: ${missingFields.join(', ')}`, 400));
        }

        const generatedUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
        const existingUser = await UserModel.findOne({ username: generatedUsername }).lean();

        if (existingUser) {
            return next(new ErrorHandler("User with this username already exists", 400));
        }

        const user = await UserModel.create({
            firstName,
            lastName,
            middleName,
            suffix,
            password,
            role,
        });

        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.username;

        res.status(201).json({
            success: true,
            message: "User added successfully",
            user: userResponse
        });

    } catch (error) {
        console.error("Error in addUser:", error);

        if (error.name === 'ValidationError') {
            return next(new ErrorHandler("Validation error. Please check your input.", 400));
        } else if (error.code === 11000) {
            return next(new ErrorHandler("Duplicate key error. Please check your input.", 400));
        }
        return next(new ErrorHandler("Internal Server Error", 500));
    }
};

exports.getUserDetails = async (req, res, next) => {
    try {
        const user = await UserModel.findById(req.params.id).select("-password -username");

        if (!user) {
            return next(
                new ErrorHandler(`User not found with id: ${req.params.id}`)
            );
        }
        if (user.softDelete) {
            return next(new ErrorHandler("User has already been deleted", 400));
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler('Error while fetching user details', 500));
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        const user = await UserModel.findById(req.params.id);

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }
        if (user.softDelete) {
            return next(new ErrorHandler("User has already been deleted", 400));
        }

        const newUserData = {
            firstName: req.body.firstName || user.firstName,
            middleName: req.body.middleName || user.middleName,
            lastName: req.body.lastName || user.lastName,
            role: req.body.role || user.role,
        };

        if (req.body.password) {
            const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
            newUserData.password = await bcrypt.hash(req.body.password, saltRounds);
        }

        if (req.body.firstName || req.body.lastName) {
            const firstName = req.body.firstName || user.firstName;
            const lastName = req.body.lastName || user.lastName;
            newUserData.username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            req.params.id,
            newUserData,
            { new: true, runValidators: true }
        ).select("-password -username");

        res.status(200).json({
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        console.error(error);
        return next(
            new ErrorHandler("An error occurred while updating the user", 500)
        );
    }
};

exports.userlist = async (req, res, next) => {
    try {
        const users = await UserModel.find({
            softDelete: false,
            role: { $ne: "super admin" }
        }).select("-password -username");

        if (users.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No users found",
                users: [],
                totalUsers: 0,
            });
        }

        res.status(200).json({
            success: true,
            users: users,
            totalUsers: users.length,
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.softDeleteUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!mongoose.isValidObjectId(userId)) {
            return next(new ErrorHandler("Invalid user ID", 400));
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        if (userId === req.user._id.toString()) {
            return next(new ErrorHandler("You cannot delete your own account", 403));
        }

        if (user.softDelete) {
            return next(new ErrorHandler("User has already been deleted", 400));
        }

        const controlUser = req.user;

        if (!controlUser || !controlUser.firstName || !controlUser.lastName || !controlUser.role) {
            return next(new ErrorHandler("User information is incomplete", 400));
        }

        user.softDelete = true;
        user.deletedAt = new Date();
        user.deletedBy = {
            fullname: `${controlUser.lastName} ${controlUser.firstName}`,
            role: controlUser.role
        };

        await user.save();

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
            user
        });

    } catch (error) {
        console.error("Error in softDeleteUser:", error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.listInactiveUsers = async (req, res, next) => {
    try {
        const users = await UserModel.find({
            softDelete: true,
            role: { $ne: "super admin" }
        }).select("-password -username");

        if (users.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No users found",
                students: [],
                users: 0,
            });
        }

        res.status(200).json({
            success: true,
            users,
            totalUsers: users.length,
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.restoreUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!mongoose.isValidObjectId(userId)) {
            return next(new ErrorHandler("Invalid user ID", 400));
        }

        const user = await UserModel.findById(userId);

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        if (userId === req.user._id.toString()) {
            return next(new ErrorHandler("You cannot restore your own account", 403));
        }

        if (!user.softDelete) {
            return next(new ErrorHandler("User is already active", 400));
        }

        const controlUser = req.user;

        if (!controlUser || !controlUser.firstName || !controlUser.lastName || !controlUser.role) {
            return next(new ErrorHandler("User information is incomplete", 400));
        }

        user.softDelete = false;
        user.restoredAt = new Date();
        user.restoredBy = {
            fullname: `${controlUser.lastName} ${controlUser.firstName}`,
            role: controlUser.role
        };
        user.deletedAt = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "User restored successfully",
            user
        });

    } catch (error) {
        console.error("Error in restoreUser:", error);
        return next(new ErrorHandler("Internal server error", 500));
    }
    
};
