const StudentModel = require("../models/student");
const ErrorHandler = require("../utils/errorHandler");
const SearchFeatures = require("../utils/searchFeature")
const mongoose = require("mongoose");


exports.createStudent = async (req, res, next) => {
    try { 
        const {
            lrn,
            firstName,
            lastName,
            middleName,
            suffix,
            sex,
            birthDate,
            age,
            religiousAffiliation,
            completeAddress,
            parents,
            guardianInfo,
            contactNumber,
            remarks
        } = req.body;

        const requiredFields = { lrn, firstName, lastName, middleName, sex, birthDate, age, religiousAffiliation, completeAddress, contactNumber };
        const missingFields = [];

        for (const [field, value] of Object.entries(requiredFields)) {
            if (!value) {
                missingFields.push(field);
            }
        }

        if (missingFields.length > 0) {
            return next(new ErrorHandler(`Please provide the following field/s: ${missingFields.join(', ')}`, 400));
        }

        const existingStudent = await StudentModel.findOne({ lrn });

        if (existingStudent) {
            return next(new ErrorHandler("Student with this LRN already exists", 400));
        }

        const student = await StudentModel.create({
            lrn,
            firstName,
            lastName,
            middleName,
            suffix,
            sex,
            birthDate,
            age,
            religiousAffiliation,
            completeAddress,
            parents,
            guardianInfo,
            contactNumber,
            remarks
        });

        res.status(201).json({
            success: true,
            message: "Student created successfully",
            student
        });

    } catch (error) {
        console.log(error);
        return next(new ErrorHandler("Internal Server Error", 500));
    }
};

exports.updateStudent = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const {
            lrn,
            firstName,
            lastName,
            middleName,
            suffix,
            sex,
            birthDate,
            age,
            religiousAffiliation,
            completeAddress,
            parents,
            guardianInfo,
            contactNumber,
            remarks
        } = req.body;

        const requiredFields = { lrn, firstName, lastName, middleName, sex, birthDate, age, religiousAffiliation, completeAddress, contactNumber };
        const missingFields = [];

        for (const [field, value] of Object.entries(requiredFields)) {
            if (!value) {
                missingFields.push(field);
            }
        }

        if (missingFields.length > 0) {
            return next(new ErrorHandler(`Please provide the following field/s: ${missingFields.join(', ')}`, 400));
        }

        const student = await StudentModel.findOne({ _id: studentId });

        if (!student) {
            return next(new ErrorHandler("Student not found", 404));
        }

        if (student.softDelete) {
            return next(new ErrorHandler("Student has already been deleted", 400));
        }

        const updateData = {
            lrn,
            firstName,
            lastName,
            middleName,
            suffix,
            sex,
            birthDate,
            age,
            religiousAffiliation,
            completeAddress,
            parents,
            guardianInfo,
            contactNumber,
            remarks
        };

        const updatedStudent = await StudentModel.findOneAndUpdate(
            { _id: studentId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Student updated successfully",
            student: updatedStudent,
        });

    } catch (error) {
        console.error("Error in updateStudent:", error);
        return next(new ErrorHandler("Internal Server Error", 500));
    }
};

exports.getStudents = async (req, res, next) => {
    try {

        const findStudent = StudentModel.find({ softDelete: false });
        const students = await new SearchFeatures(findStudent, req.query).search().query.lean();

        if (students.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No students found",
                students: [],
                totalStudents: 0,
            });
        }

        res.status(200).json({
            success: true,
            students,
            totalStudents: students.length,
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.getSingleStudent = async (req, res, next) => {
    try {
        const student = await StudentModel.findById(req.params.studentId);

        if (!student) {
            return next(
                new ErrorHandler(`Student not found with id: ${req.params.studentId}`)
            );
        }
        if (student.softDelete) {
            return next(new ErrorHandler("Student has already been deleted", 400));
        }

        res.status(200).json({
            success: true,
            student,
        });
    } catch (error) {
        console.log(error);
        return next(new ErrorHandler('Error while fetching student details'));
    }
};

exports.listActiveStudents = async (req, res, next) => {
    try {
        const students = await StudentModel.find({ softDelete: false });

        if (students.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No students found",
                students: [],
                totalStudents: 0,
            });
        }

        res.status(200).json({
            success: true,
            students,
            totalStudents: students.length,
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.listInactiveStudents = async (req, res, next) => {
    try {
        const students = await StudentModel.find({ softDelete: true });

        if (students.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No students found",
                students: [],
                totalStudents: 0,
            });
        }

        res.status(200).json({
            success: true,
            students,
            totalStudents: students.length,
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.softDeleteStudent = async (req, res, next) => {
    try {
        const { studentId } = req.params;

        if (!mongoose.isValidObjectId(studentId)) {
            return next(new ErrorHandler("Invalid student ID", 400));
        }

        const student = await StudentModel.findById(studentId);
        if (!student) {
            return next(new ErrorHandler("Student not found", 404));
        }

        if (student.softDelete) {
            return next(new ErrorHandler("Student has already been deleted", 400));
        }

        const user = req.user;

        student.softDelete = true;
        student.deletedAt = new Date();
        student.deletedBy = {
            fullname: `${user.lastName} ${user.firstName}`,
            role: user.role
        };

        await student.save();

        return res.status(200).json({
            success: true,
            message: "Student deleted successfully",
            student
        });

    } catch (error) {
        console.error("Error in DeleteStudent:", error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.restoreStudent = async (req, res, next) => {
    try {
        const { studentId } = req.params;

        if (!mongoose.isValidObjectId(studentId)) {
            return next(new ErrorHandler("Invalid student ID", 400));
        }

        const student = await StudentModel.findById(studentId);
        if (!student) {
            return next(new ErrorHandler("Student not found", 404));
        }

        if (!student.softDelete) {
            return next(new ErrorHandler("Student is already active", 400));
        }

        const user = req.user;

        if (!user || !user.firstName || !user.lastName || !user.role) {
            return next(new ErrorHandler("User information is incomplete", 400));
        }

        student.softDelete = false;
        student.restoredAt = new Date();
        student.restoredBy = {
            fullname: `${user.lastName} ${user.firstName}`,
            role: user.role
        };
        student.deletedAt = null;

        await student.save();

        return res.status(200).json({
            success: true,
            message: "Student restored successfully",
            student
        });

    } catch (error) {
        console.error("Error in restoreStudent:", error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};
