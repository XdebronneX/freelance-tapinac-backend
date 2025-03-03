const FormOneModel = require("../models/formOne");
const ClassRecordModel = require("../models/ecr");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");


exports.createForm = async (req, res, next) => {
    try {
        const {
            adviser,
            schoolName, schoolId, district, division, region, semester, schoolYear, gradeLevel,
            trackStrand, section, sectionId, course
        } = req.body;

        const normalizedStrand = trackStrand ? trackStrand.toUpperCase() : '';
        const requiredFields = { adviser, schoolName, schoolId, district, division, region, semester, schoolYear, gradeLevel, trackStrand, section };
        const missingFields = Object.entries(requiredFields)
            .filter(([_, value]) => !value)
            .map(([field]) => field);

        const courseOptions = ['Combo 1', 'Combo 2', 'Combo 3', 'ICT', 'IA (Industrial Arts)'];
        if (normalizedStrand === 'TVL') {
            if (!course) missingFields.push('course');
            if (course && !courseOptions.includes(course)) {
                return next(new ErrorHandler(`Invalid course selected for TVL strand. Valid options are: ${courseOptions.join(', ')}`, 400));
            }
        } else if (course) {
            return next(new ErrorHandler("Course should not be provided for non-TVL strands", 400));
        }

        if (missingFields.length > 0) {
            return next(new ErrorHandler(`Please provide the following field/s: ${missingFields.join(', ')}`, 400));
        }

        let savedFormOne;

        // Handle semester-specific logic
        if (semester === "2nd Semester") {
            const existingFirstSemesterForm = await FormOneModel.findOne({ _id: sectionId });

            if (existingFirstSemesterForm) {
                const formOneData = new FormOneModel({
                    adviser,
                    schoolName,
                    schoolId,
                    district,
                    division,
                    region,
                    semester,
                    schoolYear,
                    gradeLevel,
                    trackStrand: normalizedStrand,
                    section,
                    sectionId,
                    course,
                    is2ndsemesterCreated: true
                });

                savedFormOne = await formOneData.save();

                await FormOneModel.updateOne(
                    { _id: existingFirstSemesterForm._id },
                    { $set: { is2ndsemesterCreated: true, sectionId: savedFormOne._id } }
                );
            } else {
                return next(new ErrorHandler("First semester form not found for the provided section", 404));
            }
        } else {
            const formOneData = new FormOneModel({
                adviser,
                schoolName,
                schoolId,
                district,
                division,
                region,
                semester,
                schoolYear,
                gradeLevel,
                trackStrand: normalizedStrand,
                section,
                sectionId,
                course,
                is2ndsemesterCreated: false
            });

            savedFormOne = await formOneData.save();
        }

        return res.status(201).json({
            success: true,
            message: "Form created successfully",
            savedFormOne
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal Server Error", 500));
    }
};

exports.updateForm = async (req, res, next) => {
    const { formId } = req.params;
    const {
        schoolName, schoolId, district, division, region, semester, schoolYear, gradeLevel,
        trackStrand, section, sectionId, course, students = [], adviser,
    } = req.body;

    try {
        // Validate form ID
        if (!mongoose.isValidObjectId(formId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid form ID."
            });
        }

        // Fetch the form from the database
        const form = await FormOneModel.findById(formId);
        if (!form) {
            return next(new ErrorHandler("Form not found.", 404));
        }

        // Prevent updates on deleted forms
        if (form.softDelete) {
            return next(new ErrorHandler("Form has been deleted and cannot be accessed.", 400));
        }

        // Normalize trackStrand
        const normalizedStrand = trackStrand?.toUpperCase() || form.trackStrand;

        // Validate course based on trackStrand
        const courseOptions = ['Combo 1', 'Combo 2', 'Combo 3', 'ICT', 'IA (Industrial Arts)'];
        if (normalizedStrand === 'TVL') {
            if (!course) {
                return next(new ErrorHandler("Course must be provided for TVL strand.", 400));
            }
            if (!courseOptions.includes(course)) {
                return next(new ErrorHandler(`Invalid course selected for TVL strand. Valid options are: ${courseOptions.join(', ')}.`, 400));
            }
        } else if (course) {
            return next(new ErrorHandler("Course should not be provided for non-TVL strands.", 400));
        }

        // Update students in the form
        const updatedStudents = [];
        for (const studentData of students) {
            const { lrn } = studentData;

            // Find the existing student by LRN
            const existingStudent = form.students.find(student => student.lrn === lrn);
            if (existingStudent) {
                // Update existing student data while preserving addedAt
                Object.assign(existingStudent, {
                    ...studentData,
                    addedAt: existingStudent.addedAt,
                });
                updatedStudents.push(existingStudent);
            } else {
                return res.status(400).json({
                    success: false,
                    message: `Student with LRN ${lrn} not found in the form.`
                });
            }
        }

        // Update form fields including adviser
        form.trackStrand = normalizedStrand;
        form.course = course;
        form.schoolName = schoolName || form.schoolName;
        form.schoolId = schoolId || form.schoolId;
        form.district = district || form.district;
        form.division = division || form.division;
        form.region = region || form.region;
        form.semester = semester || form.semester;
        form.schoolYear = schoolYear || form.schoolYear;
        form.gradeLevel = gradeLevel || form.gradeLevel;
        form.section = section || form.section;
        form.sectionId = sectionId || form.sectionId;
        form.adviser = adviser || form.adviser;

        const savedForm = await form.save();

        return res.status(200).json({
            success: true,
            message: "Form updated successfully.",
            updatedForm: savedForm,
            updatedStudents,
        });
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal Server Error.", 500));
    }
};

exports.addStudents = async (req, res, next) => {
    const { formId } = req.params;
    const { students } = req.body;

    try {

        const form = await FormOneModel.findById(formId);

        if (!form) {
            return next(new ErrorHandler("Form not found", 404));
        }

        if (form.softDelete) {
            return next(new ErrorHandler("Form has been deleted and cannot be accessed", 400));
        }

        // Fetch all forms for validation across sections
        const allForms = await FormOneModel.find();

        const addedStudents = [];

        for (const studentData of students) {
            const {
                lrn,
                firstName,
                middleName,
                lastName,
                suffix,
                sex,
                birthDate,
                age,
                religiousAffiliation,
                completeAddress = {},
                parents = {},
                guardianInfo,
                contactNumber,
                remarks,
            } = studentData;

            // Check for duplicate LRN in the current section
            if (form.students.some(student => student.lrn === lrn)) {
                return res.status(400).json({
                    success: false,
                    message: `Student with LRN ${lrn} already exists in section ${form.section} for grade level ${form.gradeLevel}!`,
                });
            }

            // Check for duplicate LRN across sections in the same grade level and semester
            const duplicateInOtherSections = allForms.some(otherForm =>
                otherForm.gradeLevel === form.gradeLevel &&
                otherForm.semester === form.semester &&
                otherForm._id.toString() !== formId &&
                otherForm.students.some(student => student.lrn === lrn)
            );

            if (duplicateInOtherSections) {
                return res.status(400).json({
                    success: false,
                    message: `Student with LRN ${lrn} exists in another section within the same grade level (${form.gradeLevel}) and semester (${form.semester}) and cannot be added again!`,
                });
            }

            const newStudent = {
                lrn,
                firstName,
                middleName,
                lastName,
                suffix,
                sex,
                birthDate,
                age,
                religiousAffiliation,
                completeAddress,
                parents,
                guardianInfo,
                contactNumber,
                remarks,
                addedAt: new Date(),
            };

            form.students.push(newStudent);
            addedStudents.push(newStudent);
        }

        await form.save();

        // Update class records for the added students
        const ecrs = await ClassRecordModel.find({ section: form._id });
        for (const ecr of ecrs) {
            for (const student of addedStudents) {
                ecr.students.push({
                    lrn: student.lrn,
                    firstName: student.firstName,
                    middleName: student.middleName,
                    lastName: student.lastName,
                    suffix: student.suffix,
                    sex: student.sex,
                    age: student.age,
                });
            }
            await ecr.save();
        }

        return res.status(201).json({
            success: true,
            message: "Students added successfully",
            newStudents: addedStudents,
        });
    } catch (error) {
        console.error("Error adding students:", error);
        return next(new ErrorHandler("Internal Server Error", 500));
    }
};

exports.getStudentlists = async (req, res, next) => {
    const { formId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(formId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid form ID",
            });
        }

        const form = await FormOneModel.findById(formId);
        if (!form) {
            return next(new ErrorHandler("Form not found", 404));
        }

        if (form.softDelete) {
            return next(
                new ErrorHandler("Form has been deleted and cannot be accessed", 400)
            );
        }

        const genderCounts = await FormOneModel.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(formId) },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'adviser',
                    foreignField: '_id',
                    as: 'adviserDetails'
                }
            },
            {
                $unwind: {
                    path: '$adviserDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $facet: {
                    schoolData: [
                        {
                            $project: {
                                schoolName: 1,
                                schoolId: 1,
                                district: 1,
                                division: 1,
                                region: 1,
                                semester: 1,
                                schoolYear: 1,
                                gradeLevel: 1,
                                trackStrand: 1,
                                section: 1,
                                course: 1,
                                createdAt: 1,
                                adviser: {
                                    _id: '$adviserDetails._id',
                                    firstName: '$adviserDetails.firstName',
                                    middleName: '$adviserDetails.middleName',
                                    lastName: '$adviserDetails.lastName',
                                    suffix: '$adviserDetails.suffix'
                                }
                            },
                        },
                    ],
                    students: [
                        { $unwind: { path: "$students", preserveNullAndEmptyArrays: true } },
                        {
                            $group: {
                                _id: "$_id",
                                maleStudents: {
                                    $push: {
                                        $cond: [{ $eq: ["$students.sex", "Male"] }, "$students", null],
                                    },
                                },
                                femaleStudents: {
                                    $push: {
                                        $cond: [{ $eq: ["$students.sex", "Female"] }, "$students", null],
                                    },
                                },
                            },
                        },
                    ],
                },
            },
            {
                $project: {
                    schoolData: { $arrayElemAt: ["$schoolData", 0] },
                    maleStudents: { $arrayElemAt: ["$students.maleStudents", 0] },
                    femaleStudents: { $arrayElemAt: ["$students.femaleStudents", 0] },
                },
            },
        ]);

        if (!genderCounts || !genderCounts[0]) {
            return res.status(200).json({
                success: true,
                message: "No students or school data found",
                schoolData: {},
                maleStudents: [],
                totalMaleStudents: 0,
                femaleStudents: [],
                totalFemaleStudents: 0,
                totalStudents: 0,
            });
        }

        const { schoolData, maleStudents, femaleStudents } = genderCounts[0];

        if (!schoolData) {
            return res.status(200).json({
                success: true,
                message: "No school data found",
                schoolData: {},
                maleStudents: [],
                totalMaleStudents: 0,
                femaleStudents: [],
                totalFemaleStudents: 0,
                totalStudents: 0,
            });
        }

        // Ensure no null values in male and female students arrays
        const filteredMaleStudents = maleStudents.filter(student => student !== null);
        const filteredFemaleStudents = femaleStudents.filter(student => student !== null);

        const totalMaleStudents = filteredMaleStudents.length;
        const totalFemaleStudents = filteredFemaleStudents.length;
        const totalStudents = totalMaleStudents + totalFemaleStudents;

        return res.status(200).json({
            success: true,
            schoolData,
            maleStudents: filteredMaleStudents,
            totalMaleStudents,
            femaleStudents: filteredFemaleStudents,
            totalFemaleStudents,
            totalStudents,
        });
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal Server Error", 500));
    }
};

exports.formoneList = async (req, res, next) => {
    try {
        const formones = await FormOneModel.find({ softDelete: false }).populate({
            path: 'adviser',
            select: 'firstName middleName lastName suffix'
        });

        if (formones.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No form one found",
                formones: [],
                totalFormones: 0,
            });
        }

        res.status(200).json({
            success: true,
            formones,
            totalFormones: formones.length,
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.softDeleteFormone = async (req, res, next) => {
    try {
        const { formId } = req.params;

        if (!mongoose.isValidObjectId(formId)) {
            return next(new ErrorHandler("Invalid student ID", 400));
        }

        const formone = await FormOneModel.findById(formId);
        if (!formone) {
            return next(new ErrorHandler("Form one not found", 404));
        }

        if (formone.softDelete) {
            return next(new ErrorHandler("Form one has already been deleted", 400));
        }

        const user = req.user;

        formone.softDelete = true;
        formone.deletedAt = new Date();
        formone.deletedBy = {
            fullname: `${user.lastName} ${user.firstName}`,
            role: user.role
        };

        // If this is the 2nd semester and it is being soft-deleted, update the 1st semester
        if (formone.semester.toLowerCase() === "2nd semester") {
            const firstSemesterForm = await FormOneModel.findOne({ section: formone.section });
            if (firstSemesterForm) {
                // Set is2ndSemesterCreated to false in the 1st semester
                firstSemesterForm.is2ndsemesterCreated = false;
                await firstSemesterForm.save();
            }
        }

        await formone.save();

        return res.status(200).json({
            success: true,
            message: "Form one deleted successfully, and 2nd semester marked as deleted",
            formone
        });

    } catch (error) {
        console.error("Error in delete:", error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.listInactiveSections = async (req, res, next) => {
    try {
        const sections = await FormOneModel.find({ softDelete: true }).populate({
            path: 'adviser',
            select: 'firstName middleName lastName suffix'
        });;

        if (sections.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No sections found",
                sections: [],
                totalSections: 0,
            });
        }

        res.status(200).json({
            success: true,
            sections,
            totalSections: sections.length,
        });


    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.restoreFormone = async (req, res, next) => {
    try {
        const { formId } = req.params;

        if (!mongoose.isValidObjectId(formId)) {
            return next(new ErrorHandler("Invalid student ID", 400));
        }

        const formone = await FormOneModel.findById(formId);
        if (!formone) {
            return next(new ErrorHandler("Form one not found", 404));
        }

        if (!formone.softDelete) {
            return next(new ErrorHandler("Form one is already active", 400));
        }

        const user = req.user;

        if (!user || !user.firstName || !user.lastName || !user.role) {
            return next(new ErrorHandler("User information is incomplete", 400));
        }

        formone.softDelete = false;
        formone.restoredAt = new Date();
        formone.restoredBy = {
            fullname: `${user.lastName} ${user.firstName}`,
            role: user.role
        };
        formone.deletedAt = null;

        await formone.save();

        return res.status(200).json({
            success: true,
            message: "Form one restored successfully",
            formone
        });

    } catch (error) {
        console.error("Error in restore:", error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};
