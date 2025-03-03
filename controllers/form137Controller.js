const ClassRecordModel = require('../models/ecr');
const FormOneModel = require('../models/formOne');
const Form137Model = require('../models/form137');
const ErrorHandler = require("../utils/errorHandler");

exports.getStudentGrade11AndGrade12 = async (req, res, next) => {
    try {
        const { lrn } = req.params;
        if (!lrn) {
            return res.status(400).json({ success: false, message: "LRN is required" });
        }

        const gradeLevels = ["Grade 11", "Grade 12"];
        const semesters = ["1st Semester", "2nd Semester"];
        let response = {
            success: true,
            form137: {
                student: {},
                gradeElevenSchoolDetails: {},
                gradeTwelveSchoolDetails: {}
            }
        };

        // Fetch student data
        const studentData = await FormOneModel.findOne({
            "students.lrn": lrn,
            softDelete: false
        }).select("students.$");

        if (!studentData) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        const student = studentData.students[0];
        response.form137.student = {
            lrn: student.lrn,
            firstName: student.firstName,
            middleName: student.middleName,
            lastName: student.lastName,
            suffix: student.suffix || "",
            sex: student.sex,
            birthDate: student.birthDate
        };

        for (const gradeLevel of gradeLevels) {
            let schoolDetails = {};

            for (const semester of semesters) {
                const formOneData = await FormOneModel.findOne({
                    "students.lrn": lrn,
                    gradeLevel: gradeLevel,
                    semester: semester,
                    softDelete: false
                });

                const ecrData = await ClassRecordModel.find({
                    "students.lrn": lrn,
                    section: formOneData?._id,
                    softDelete: false
                });

                let subjects = [];
                let totalGrades = 0;
                let remarksArray = [];

                if (ecrData && ecrData.length > 0) {
                    ecrData.forEach(record => {
                        const studentRecord = record.students.find(s => s.lrn === lrn);

                        if (studentRecord) {
                            const finalGrade = studentRecord.finalSemesterGrade;
                            subjects.push({
                                subjectName: record.subject,
                                subjectCategory: record.category,
                                finalSemesterGrade: finalGrade || {}
                            });

                            if (finalGrade && finalGrade.finalGrade) {
                                totalGrades += finalGrade.finalGrade;
                                if (finalGrade.remarks) {
                                    remarksArray.push(finalGrade.remarks);
                                }
                            }
                        }
                    });
                }

                const generalAverage = subjects.length > 0
                    ? {
                        average: totalGrades / subjects.length,
                        remarks: remarksArray.every(r => r === "Passed") ? "Passed" : "Failed"
                    }
                    : null;

                schoolDetails[semester === "1st Semester" ? "firstSemester" : "secondSemester"] = {
                    subjects,
                    generalAverage,
                    schoolName: formOneData?.schoolName || "",
                    schoolId: formOneData?.schoolId || "",
                    gradeLevel,
                    schoolYear: formOneData?.schoolYear || "",
                    semester,
                    trackStrand: formOneData?.trackStrand || "",
                    section: formOneData?.section || "",
                    sectionId: formOneData?.sectionId || null
                };
            }

            if (gradeLevel === "Grade 11") {
                response.form137.gradeElevenSchoolDetails = schoolDetails;
            } else if (gradeLevel === "Grade 12") {
                response.form137.gradeTwelveSchoolDetails = schoolDetails;
            }
        }

        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

exports.getSingleForm137 = async (req, res, next) => {
    try {
        // Use the LRN to find the Form137 document
        const form137 = await Form137Model.findOne({ 'student.lrn': req.params.lrn });

        // If the document does not exist, return an error
        if (!form137) {
            return next(
                new ErrorHandler(`Form137 not found with LRN: ${req.params.lrn}`, 404)
            );
        }

        // If the document is soft-deleted, return an error
        if (form137.softDelete) {
            return next(new ErrorHandler('Form137 has already been deleted', 400));
        }

        // Send the response with the form137 data
        res.status(200).json({
            success: true,
            form137,
        });
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler('Error while fetching Form137 details', 500));
    }
};

exports.listActiveForm137 = async (req, res, next) => {
    try {
        const forms137 = await Form137Model.find({ softDelete: false });

        if (forms137.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No form 137 found",
                forms137: [],
                totalForm137: 0,
            });
        }

        res.status(200).json({
            success: true,
            forms137,
            totalForm137: forms137.length,
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.listInactiveForm137 = async (req, res, next) => {
    try {
        const forms137 = await Form137Model.find({ softDelete: true });

        if (forms137.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No form 137 found",
                forms137: [],
                totalForm137: 0,
            });
        }

        res.status(200).json({
            success: true,
            forms137,
            totalForm137: forms137.length,
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.softDeleteForm137 = async (req, res, next) => {
    try {
        const form137 = await Form137Model.findOne({ 'student.lrn': req.params.lrn });
        if (!form137) {
            return next(new ErrorHandler(`Form137 not found with lrn: ${req.params.lrn}`, 404));
        }

        if (form137.softDelete) {
            return next(new ErrorHandler("Form137 has already been deleted", 400));
        }
        
        const user = req.user;

        form137.softDelete = true;
        form137.deletedAt = Date.now();
        form137.deletedBy = {
            fullname: `${user.lastName} ${user.firstName}`,
            role: user.role
        };
        await form137.save();
        res.status(200).json({
            success: true,
            message: "Form137 has been deleted",
        });
    }
    catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.restoreForm137 = async (req, res, next) => {
    try {
        const form137 = await Form137Model.findOne({ 'student.lrn': req.params.lrn });
        if (!form137) {
            return next(new ErrorHandler(`Form137 not found with lrn: ${req.params.lrn}`, 404));
        }
        if (!form137.softDelete) {
            return next(new ErrorHandler("Form137 is already active", 400));
        }

        const user = req.user;

        form137.softDelete = false;
        form137.restoredAt = Date.now();
        form137.restoredBy = {
            fullname: `${user.lastName} ${user.firstName}`,
            role: user.role
        };
        await form137.save();
        res.status(200).json({
            success: true,
            message: "Form137 has been restored",
        });
    }
    catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};