const FormOneModel = require("../models/formOne");
const ClassRecordModel = require("../models/ecr");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");

const validTracks = [
    "Core Subject",
    "Academic Track",
    "Work Immersion",
    "TVL/Sports/Arts and Design"
];

exports.createClassRecord = async (req, res, next) => {
    const { formId } = req.params;
    const { subject, track, category } = req.body;

    try {
        if (!track) {
            return res.status(400).json({
                success: false,
                message: "Track is required."
            });
        }

        if (!validTracks.includes(track)) {
            return res.status(400).json({
                success: false,
                message: "Invalid track provided. Please choose a valid track."
            });
        }

        const teachers = req.user;

        const formOne = await FormOneModel.findById(formId);
        if (!formOne) {
            return res.status(404).json({
                success: false,
                message: "FormOne not found with the provided formId."
            });
        }

        const students = formOne.students.map(student => ({
            firstName: student.firstName,
            middleName: student.middleName,
            lastName: student.lastName,
            suffix: student.suffix,
            sex: student.sex,
            lrn: student.lrn,
            firstQuarter: {
                scoreRecords: {
                    writtenWorks: {
                        percentScore: 0,
                        weightedScore: 0,
                        total: 0,
                        scores: []
                    },
                    performanceTask: {
                        percentScore: 0,
                        weightedScore: 0,
                        total: 0,
                        scores: []
                    },
                    quarterlyAssessment: {
                        percentScore: 0,
                        weightedScore: 0,
                        score: 0
                    },
                    initialGrade: 0,
                    quarterlyGrade: 0
                }
            },
            secondQuarter: {
                scoreRecords: {
                    writtenWorks: {
                        percentScore: 0,
                        weightedScore: 0,
                        total: 0,
                        scores: []
                    },
                    performanceTask: {
                        percentScore: 0,
                        weightedScore: 0,
                        total: 0,
                        scores: []
                    },
                    quarterlyAssessment: {
                        percentScore: 0,
                        weightedScore: 0,
                        score: 0
                    },
                    initialGrade: 0,
                    quarterlyGrade: 0
                }
            },
            finalSemesterGrade: {
                firstQuarter: 0,
                secondQuarter: 0,
                finalGrade: 0,
                remarks: ''
            }
        }));

        const newClassRecord = new ClassRecordModel({
            section: formOne._id,
            subject,
            track,
            category,
            teachers,
            firstQuarterPossibleScores: {
                writtenWorks: [],
                performanceTask: [],
                quarterlyGrade: 0
            },
            secondQuarterPossibleScores: {
                writtenWorks: [],
                performanceTask: [],
                quarterlyGrade: 0
            },
            students,
            softDelete: false
        });

        await newClassRecord.save();

        const formattedClassRecord = {
            ...newClassRecord._doc,
            teachers: {
                _id: teachers._id,
                firstName: teachers.firstName,
                middleName: teachers.middleName,
                lastName: teachers.lastName,
                suffix: teachers.suffix,
            }
        };

        return res.status(201).json({
            success: true,
            message: "Class record added successfully.",
            classRecord: formattedClassRecord
        });
    } catch (error) {
        console.error("Error in addNewClassRecord:", error);
        return next(new ErrorHandler("Internal Server Error", 500));
    }
};

exports.getSingleEcr = async (req, res, next) => {
    try {
        const record = await ClassRecordModel.findById(req.params.classRecordId).populate([
            { path: 'section', select: '-students -softDelete -deletedAt -restoredAt -createdAt -__v -_id' },
            { path: 'teachers', select: 'firstName middleName lastName suffix' }
        ]);

        if (!record) {
            return next(
                new ErrorHandler(`Record not found with id: ${req.params.classRecordId}`)
            );
        }

        if (record.softDelete) {
            return next(new ErrorHandler("Record has already been deleted", 400));
        }

        // Helper function to replace 0 with null recursively
        const replaceZerosWithNull = (obj, visited = new WeakSet()) => {
            if (visited.has(obj)) return; // Prevent infinite recursion
            if (typeof obj === 'object' && obj !== null) {
                visited.add(obj); // Mark the current object as visited
                for (const key in obj) {
                    if (typeof obj[key] === 'object' && obj[key] !== null) {
                        replaceZerosWithNull(obj[key], visited);
                    } else if (obj[key] === 0) {
                        obj[key] = null; // Replace 0 with null
                    }
                }
            }
        };


        // Helper function to validate and clean quarterlyGrade
        // Helper function to validate and clean quarterlyGrade
        const cleanQuarterlyGrades = (obj, visited = new WeakSet()) => {
            if (visited.has(obj)) return; // Prevent infinite recursion
            if (typeof obj === 'object' && obj !== null) {
                visited.add(obj); // Mark the current object as visited
                for (const key in obj) {
                    if (key === 'firstQuarterPossibleScores' || key === 'secondQuarterPossibleScores') continue; // Skip specific fields

                    if (key === 'quarterlyGrade' && typeof obj[key] === 'number') {
                        // Check if there are scores in related fields
                        const hasScores = ['writtenWorks', 'performanceTask', 'quarterlyAssessment']
                            .some(field => obj[field]?.scores?.length > 0);

                        if (!hasScores) {
                            obj[key] = null; // Set quarterlyGrade to null if no scores are present
                        }
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        cleanQuarterlyGrades(obj[key], visited);
                    }
                }
            }
        };


        // Apply cleaning functions to the record
        replaceZerosWithNull(record);
        cleanQuarterlyGrades(record);

        res.status(200).json({
            success: true,
            record,
        });
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler('Error while fetching record details', 500));
    }
};

exports.getSingleScores = async (req, res, next) => {
    try {
        const { classRecordId, lrn } = req.params;

        const record = await ClassRecordModel.findById(classRecordId).populate([
            {
                path: 'section',
                select: '-students -softDelete -deletedAt -restoredAt -createdAt -__v -_id'
            },
            {
                path: 'teachers',
                select: 'firstName middleName lastName suffix'
            }
        ]);

        if (!record) {
            return next(new ErrorHandler(`Record not found with id: ${classRecordId}`));
        }

        if (record.softDelete) {
            return next(new ErrorHandler("Record has already been deleted", 400));
        }

        // Extract relevant scores from the record for a specific student
        const extractScores = (students, quarterKey) => {
            // Find the student by lrn
            const student = students.find(student => student.lrn === lrn);
            if (!student) {
                return null; // Return null if student is not found
            }

            const { firstName, lastName, middleName } = student;
            const scoreRecords = student[quarterKey]?.scoreRecords || {};

            return {
                lrn,
                firstName,
                middleName,
                lastName,
                writtenWorks: scoreRecords.writtenWorks?.scores || [],
                performanceTask: scoreRecords.performanceTask?.scores || [],
                quarterlyAssessment: scoreRecords.quarterlyAssessment?.score || null
            };
        };

        const firstQuarterScores = extractScores(record.students, 'firstQuarter');
        const secondQuarterScores = extractScores(record.students, 'secondQuarter');

        if (!firstQuarterScores && !secondQuarterScores) {
            return next(new ErrorHandler(`No scores found for student with LRN: ${lrn}`, 404));
        }

        res.status(200).json({
            success: true,
            scores: {
                firstQuarter: firstQuarterScores,
                secondQuarter: secondQuarterScores
            }
        });
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler('Error while fetching record details'));
    }
};

exports.updateClassRecord = async (req, res, next) => {
    const { classRecordId } = req.params;
    const { subject, track, category } = req.body;

    try {

        if (!track) {
            return res.status(400).json({
                success: false,
                message: "Track is required."
            });
        }

        // Validate that the provided track is one of the valid track types
        if (!validTracks.includes(track)) {
            return res.status(400).json({
                success: false,
                message: "Invalid track provided. Please choose a valid track."
            });
        }

        const classRecord = await ClassRecordModel.findById(classRecordId);
        if (!classRecord) {
            return res.status(404).json({
                success: false,
                message: "Class record not found."
            });
        }

        if (classRecord.softDelete) {
            return next(new ErrorHandler("Record has already been deleted", 400));
        }

        classRecord.subject = subject || classRecord.subject;
        classRecord.track = track || classRecord.track;
        classRecord.category = category || classRecord.category;

        const updatedClassRecord = await classRecord.save();

        return res.status(200).json({
            success: true,
            message: "Class record updated successfully.",
            data: updatedClassRecord
        });
    } catch (error) {
        console.error("Error in updateClassRecord:", error);
        return next(new ErrorHandler("Internal Server Error", 500));
    }
};

//** Computations */
const trackWeights = {
    "Core Subject": {
        writtenWorks: 0.25,
        performanceTask: 0.50,
        quarterlyAssessment: 0.25
    },
    "Academic Track": {
        writtenWorks: 0.25,
        performanceTask: 0.45,
        quarterlyAssessment: 0.30
    },
    "Work Immersion": {
        writtenWorks: 0.35,
        performanceTask: 0.40,
        quarterlyAssessment: 0.25
    },
    "TVL/Sports/Arts and Design": {
        writtenWorks: 0.20,
        performanceTask: 0.60,
        quarterlyAssessment: 0.20
    }
};

const calculatePercentScore = (totalScore, possibleScore) => {
    return (totalScore > possibleScore ? possibleScore : totalScore) / possibleScore * 100;
};

const calculateWeightedScore = (percentScore, track, category) => {
    const weights = trackWeights[track];
    if (!weights) {
        throw new Error(`Track not found: ${track}`);
    }

    if (weights[category] === undefined) {
        throw new Error(`Category '${category}' not found for track '${track}'`);
    }

    return percentScore * weights[category];
};

const gradeMapping = [
    { min: 100, max: 100, transmuted: 100 },
    { min: 98.40, max: 99.99, transmuted: 99 },
    { min: 96.80, max: 98.39, transmuted: 98 },
    { min: 95.20, max: 96.79, transmuted: 97 },
    { min: 93.60, max: 95.19, transmuted: 96 },
    { min: 92.00, max: 93.59, transmuted: 95 },
    { min: 90.40, max: 91.99, transmuted: 94 },
    { min: 88.80, max: 90.39, transmuted: 93 },
    { min: 87.20, max: 88.79, transmuted: 92 },
    { min: 85.60, max: 87.19, transmuted: 91 },
    { min: 84.00, max: 85.59, transmuted: 90 },
    { min: 82.40, max: 83.99, transmuted: 89 },
    { min: 80.80, max: 82.39, transmuted: 88 },
    { min: 79.20, max: 80.79, transmuted: 87 },
    { min: 77.60, max: 79.19, transmuted: 86 },
    { min: 76.00, max: 77.59, transmuted: 85 },
    { min: 74.40, max: 75.99, transmuted: 84 },
    { min: 72.80, max: 74.39, transmuted: 83 },
    { min: 71.20, max: 72.79, transmuted: 82 },
    { min: 69.60, max: 71.19, transmuted: 81 },
    { min: 68.00, max: 69.59, transmuted: 80 },
    { min: 66.40, max: 67.99, transmuted: 79 },
    { min: 64.80, max: 66.39, transmuted: 78 },
    { min: 63.20, max: 64.79, transmuted: 77 },
    { min: 61.60, max: 63.19, transmuted: 76 },
    { min: 60.00, max: 61.59, transmuted: 75 },
    { min: 56.00, max: 59.99, transmuted: 74 },
    { min: 52.00, max: 55.99, transmuted: 73 },
    { min: 48.00, max: 51.99, transmuted: 72 },
    { min: 44.00, max: 47.99, transmuted: 71 },
    { min: 40.00, max: 43.99, transmuted: 70 },
    { min: 36.00, max: 39.99, transmuted: 69 },
    { min: 32.00, max: 35.99, transmuted: 68 },
    { min: 28.00, max: 31.99, transmuted: 67 },
    { min: 24.00, max: 27.99, transmuted: 66 },
    { min: 20.00, max: 23.99, transmuted: 65 },
    { min: 16.00, max: 19.99, transmuted: 64 },
    { min: 12.00, max: 15.99, transmuted: 63 },
    { min: 8.00, max: 11.99, transmuted: 62 },
    { min: 4.00, max: 7.99, transmuted: 61 },
    { min: 0.00, max: 3.99, transmuted: 60 },
];

//** First quarter */
exports.updateFirstQuarter = async (req, res, next) => {
    const { classRecordId } = req.params;
    const { studentId, firstQuarterData } = req.body;

    try {
        const classRecord = await ClassRecordModel.findById(classRecordId).select("-students.generalAverage");
        if (!classRecord) {
            return res.status(404).json({ message: "Class record not found" });
        }

        const student = classRecord.students.find(s => s._id.toString() === studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found in this class record" });
        }

        if (firstQuarterData) {
            const { writtenWorks, performanceTask, quarterlyAssessment } = firstQuarterData.scoreRecords;

            // Validate scores
            const hasNullValues =
                (writtenWorks?.scores && writtenWorks.scores.includes(null)) ||
                (performanceTask?.scores && performanceTask.scores.includes(null)) ||
                (quarterlyAssessment?.score === null);

            if (hasNullValues) {
                student.firstQuarter.scoreRecords = {
                    writtenWorks: {
                        ...writtenWorks,
                        total: writtenWorks?.scores?.reduce((a, b) => a + (b || 0), 0) || 0,
                        percentScore: 0,
                        weightedScore: 0,
                    },
                    performanceTask: {
                        ...performanceTask,
                        total: performanceTask?.scores?.reduce((a, b) => a + (b || 0), 0) || 0,
                        percentScore: 0,
                        weightedScore: 0,
                    },
                    quarterlyAssessment: {
                        ...quarterlyAssessment,
                        percentScore: 0,
                        weightedScore: 0,
                        score: quarterlyAssessment?.score || 0,
                    },
                    initialGrade: 0,
                    quarterlyGrade: 0,
                };

                await classRecord.save();
                return res.status(200).json({
                    success: true,
                    message: "Scores updated successfully, but grades were not computed due to missing values.",
                    classRecord,
                });
            }

            // Compute totals
            const writtenWorksTotal = writtenWorks.scores.reduce((a, b) => a + b, 0);
            const performanceTaskTotal = performanceTask.scores.reduce((a, b) => a + b, 0);
            const quarterlyAssessmentScore = quarterlyAssessment?.score || 0;

            // Compute percent scores
            const writtenWorksPercent = calculatePercentScore(
                writtenWorksTotal,
                classRecord.firstQuarterPossibleScores.writtenWorks.reduce((a, b) => a + b, 0)
            );
            const performanceTaskPercent = calculatePercentScore(
                performanceTaskTotal,
                classRecord.firstQuarterPossibleScores.performanceTask.reduce((a, b) => a + b, 0)
            );
            const quarterlyAssessmentPercent = calculatePercentScore(
                quarterlyAssessmentScore,
                classRecord.firstQuarterPossibleScores.quarterlyGrade
            );

            // Compute weighted scores
            const writtenWorksWeighted = calculateWeightedScore(writtenWorksPercent, classRecord.track, "writtenWorks");
            const performanceTaskWeighted = calculateWeightedScore(performanceTaskPercent, classRecord.track, "performanceTask");
            const quarterlyAssessmentWeighted = calculateWeightedScore(quarterlyAssessmentPercent, classRecord.track, "quarterlyAssessment");

            // Compute initial grade and quarterly grade
            const initialGrade = (writtenWorksWeighted + performanceTaskWeighted + quarterlyAssessmentWeighted).toFixed(2);
            const quarterlyGrade = gradeMapping.find(
                ({ min, max }) => initialGrade >= min && initialGrade <= max
            )?.transmuted || 0;

            // Update student data
            student.firstQuarter.scoreRecords = {
                writtenWorks: {
                    ...writtenWorks,
                    total: writtenWorksTotal,
                    percentScore: writtenWorksPercent.toFixed(2),
                    weightedScore: writtenWorksWeighted.toFixed(2),
                },
                performanceTask: {
                    ...performanceTask,
                    total: performanceTaskTotal,
                    percentScore: performanceTaskPercent.toFixed(2),
                    weightedScore: performanceTaskWeighted.toFixed(2),
                },
                quarterlyAssessment: {
                    ...quarterlyAssessment,
                    score: quarterlyAssessmentScore,
                    percentScore: quarterlyAssessmentPercent.toFixed(2),
                    weightedScore: quarterlyAssessmentWeighted.toFixed(2),
                },
                initialGrade: parseFloat(initialGrade),
                quarterlyGrade,
            };

            // Compute Final Semester Grade
            const secondQuarterGrade = student.secondQuarter?.scoreRecords?.quarterlyGrade || null;
            let finalGrade = null;
            let remarks = "Failed";

            if (secondQuarterGrade !== null) {
                finalGrade = Math.round((parseFloat(quarterlyGrade) + parseFloat(secondQuarterGrade)) / 2) || 0;
                remarks = finalGrade < 75 ? "Failed" : "Passed";
            }

            student.finalSemesterGrade = {
                firstQuarter: parseFloat(quarterlyGrade),
                secondQuarter: secondQuarterGrade ? parseFloat(secondQuarterGrade) : null,
                finalGrade,
                remarks,
            };
        } else {
            return res.status(400).json({ message: "First quarter data is missing" });
        }

        await classRecord.save();
        return res.status(200).json({
            success: true,
            message: "Class record updated successfully",
            classRecord,
        });
    } catch (error) {
        console.error("Error in updateFirstQuarter:", error);
        return next(new ErrorHandler("Internal Server Error", 500));
    }
};

exports.updatePossibleScoresFQ = async (req, res, next) => {
    const { classRecordId } = req.params;
    const { possibleScores } = req.body;

    try {
        const classRecord = await ClassRecordModel.findById(classRecordId).select("-students.generalAverage");
        if (!classRecord) {
            return res.status(404).json({ message: "Class record not found" });
        }

        if (!possibleScores) {
            return res.status(400).json({ message: "Possible scores are missing or incomplete" });
        }

        classRecord.firstQuarterPossibleScores = possibleScores;

        const safeReduce = (array, reducer, initialValue) => {
            return Array.isArray(array) && array.length > 0
                ? array.reduce(reducer, initialValue)
                : initialValue;
        };

        const safeDivision = (numerator, denominator) => {
            return denominator > 0 ? numerator / denominator : 0;
        };

        for (let student of classRecord.students) {
            const { writtenWorks, performanceTask, quarterlyAssessment } = student.firstQuarter.scoreRecords;

            // Validate student data
            const hasNullValues = [
                ...(writtenWorks?.scores || []),
                ...(performanceTask?.scores || []),
                quarterlyAssessment?.score
            ].some(score => score === null || score === undefined || score === 0);

            // If there's a null or 0 value in scores, skip grade computation
            if (hasNullValues) {
                student.firstQuarter.scoreRecords = {
                    writtenWorks: {
                        ...writtenWorks,
                        total: 0,
                        percentScore: 0,
                        weightedScore: 0,
                        scores: writtenWorks?.scores || [],
                    },
                    performanceTask: {
                        ...performanceTask,
                        total: 0,
                        percentScore: 0,
                        weightedScore: 0,
                        scores: performanceTask?.scores || [],
                    },
                    quarterlyAssessment: {
                        ...quarterlyAssessment,
                        percentScore: 0,
                        weightedScore: 0,
                        score: quarterlyAssessment?.score || 0,
                    },
                    initialGrade: 0,
                    quarterlyGrade: null,
                };
                continue; // Skip computation for this student
            }

            const totalWrittenWorks = safeReduce(writtenWorks.scores, (a, b) => a + b, 0);
            const totalPerformanceTask = safeReduce(performanceTask.scores, (a, b) => a + b, 0);
            const totalQuarterlyAssessment = quarterlyAssessment.score;

            const totalPossibleWrittenWorks = safeReduce(possibleScores.writtenWorks, (a, b) => a + b, 0);
            const totalPossiblePerformanceTask = safeReduce(possibleScores.performanceTask, (a, b) => a + b, 0);
            const totalPossibleQuarterlyAssessment = possibleScores.quarterlyGrade;

            // Percent scores
            const writtenWorksPercentScore = parseFloat(
                (safeDivision(totalWrittenWorks, totalPossibleWrittenWorks) * 100).toFixed(2)
            );
            const performanceTaskPercentScore = parseFloat(
                (safeDivision(totalPerformanceTask, totalPossiblePerformanceTask) * 100).toFixed(2)
            );
            const quarterlyAssessmentPercentScore = parseFloat(
                (safeDivision(totalQuarterlyAssessment, totalPossibleQuarterlyAssessment) * 100).toFixed(2)
            );

            // Weighted scores
            const writtenWorksWeightedScore = parseFloat(
                calculateWeightedScore(writtenWorksPercentScore, classRecord.track, "writtenWorks").toFixed(2)
            );
            const performanceTaskWeightedScore = parseFloat(
                calculateWeightedScore(performanceTaskPercentScore, classRecord.track, "performanceTask").toFixed(2)
            );
            const quarterlyAssessmentWeightedScore = parseFloat(
                calculateWeightedScore(quarterlyAssessmentPercentScore, classRecord.track, "quarterlyAssessment").toFixed(2)
            );

            // Grades
            const initialGrade = parseFloat(
                (writtenWorksWeightedScore + performanceTaskWeightedScore + quarterlyAssessmentWeightedScore).toFixed(2)
            );

            // Only apply transmutedGrade if all required scores are valid
            let transmutedGrade = initialGrade;
            if (!hasNullValues) {
                transmutedGrade =
                    gradeMapping.find((g) => initialGrade >= g.min && initialGrade <= g.max)?.transmuted || initialGrade;
            }

            // Update student's first quarter score records
            student.firstQuarter.scoreRecords = {
                writtenWorks: {
                    ...writtenWorks,
                    total: totalWrittenWorks,
                    percentScore: writtenWorksPercentScore,
                    weightedScore: writtenWorksWeightedScore,
                },
                performanceTask: {
                    ...performanceTask,
                    total: totalPerformanceTask,
                    percentScore: performanceTaskPercentScore,
                    weightedScore: performanceTaskWeightedScore,
                },
                quarterlyAssessment: {
                    ...quarterlyAssessment,
                    percentScore: quarterlyAssessmentPercentScore,
                    weightedScore: quarterlyAssessmentWeightedScore,
                },
                initialGrade: !isNaN(initialGrade) ? initialGrade : 0,
                quarterlyGrade: !isNaN(transmutedGrade) ? transmutedGrade : 0,
            };

            // For final grade computation: check second quarter grade and calculate final grade
            const secondQuarterGrade = student.secondQuarter?.scoreRecords?.quarterlyGrade || null;

            if (secondQuarterGrade !== null) {
                const finalGrade = Math.round((initialGrade + secondQuarterGrade) / 2);
                const remarks = finalGrade < 75 ? "Failed" : "Passed";

                student.finalSemesterGrade = {
                    firstQuarter: initialGrade,
                    secondQuarter: secondQuarterGrade,
                    finalGrade,
                    remarks,
                };
            } else {
                student.finalSemesterGrade = {
                    firstQuarter: initialGrade,
                    secondQuarter: secondQuarterGrade,
                    finalGrade: null,
                    remarks: "Failed",
                };
            }
        }

        await classRecord.save();

        return res.status(200).json({
            success: true,
            message: "Successfully set first quarter possible scores",
            classRecord,
        });
    } catch (error) {
        console.error("Error in updatePossibleScoresFQ:", error);
        return next(new ErrorHandler("Internal Server Error", 500));
    }
};

//** Second quarter */
exports.updateSecondQuarter = async (req, res, next) => {
    const { classRecordId } = req.params;
    const { studentId, secondQuarterData } = req.body;

    try {
        const classRecord = await ClassRecordModel.findById(classRecordId).select("-students.generalAverage");
        if (!classRecord) {
            return res.status(404).json({ message: "Class record not found" });
        }

        const student = classRecord.students.find(s => s._id.toString() === studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found in this class record" });
        }

        if (secondQuarterData) {
            const { writtenWorks, performanceTask, quarterlyAssessment } = secondQuarterData.scoreRecords;

            // Check for null values in the scores
            const hasNullValues =
                (writtenWorks?.scores && writtenWorks.scores.includes(null)) ||
                (performanceTask?.scores && performanceTask.scores.includes(null)) ||
                (quarterlyAssessment?.score === null);

            if (hasNullValues) {
                student.secondQuarter.scoreRecords = {
                    writtenWorks: {
                        ...writtenWorks,
                        total: writtenWorks?.scores?.reduce((a, b) => a + (b || 0), 0) || 0,
                        percentScore: 0,
                        weightedScore: 0,
                    },
                    performanceTask: {
                        ...performanceTask,
                        total: performanceTask?.scores?.reduce((a, b) => a + (b || 0), 0) || 0,
                        percentScore: 0,
                        weightedScore: 0,
                    },
                    quarterlyAssessment: {
                        ...quarterlyAssessment,
                        score: quarterlyAssessment?.score || 0,
                        percentScore: 0,
                        weightedScore: 0,
                    },
                    initialGrade: 0,
                    quarterlyGrade: 0,
                };

                await classRecord.save();
                return res.status(200).json({
                    success: true,
                    message: "Scores updated successfully, but grades were not computed due to missing values.",
                    classRecord,
                });
            }

            // Safely calculate totals
            const totalWrittenWorks = writtenWorks.scores.reduce((a, b) => a + b, 0);
            const totalPerformanceTask = performanceTask.scores.reduce((a, b) => a + b, 0);
            const totalQuarterlyAssessment = quarterlyAssessment?.score || 0;

            const totalPossibleWrittenWorks = classRecord.secondQuarterPossibleScores.writtenWorks.reduce((a, b) => a + b, 0);
            const totalPossiblePerformanceTask = classRecord.secondQuarterPossibleScores.performanceTask.reduce((a, b) => a + b, 0);
            const possibleQuarterlyAssessment = classRecord.secondQuarterPossibleScores.quarterlyGrade;

            // Calculate percent scores
            const writtenWorksPercent = calculatePercentScore(totalWrittenWorks, totalPossibleWrittenWorks).toFixed(2);
            const performanceTaskPercent = calculatePercentScore(totalPerformanceTask, totalPossiblePerformanceTask).toFixed(2);
            const quarterlyAssessmentPercent = calculatePercentScore(totalQuarterlyAssessment, possibleQuarterlyAssessment).toFixed(2);

            // Calculate weighted scores
            const writtenWorksWeighted = calculateWeightedScore(parseFloat(writtenWorksPercent), classRecord.track, 'writtenWorks').toFixed(2);
            const performanceTaskWeighted = calculateWeightedScore(parseFloat(performanceTaskPercent), classRecord.track, 'performanceTask').toFixed(2);
            const quarterlyAssessmentWeighted = calculateWeightedScore(parseFloat(quarterlyAssessmentPercent), classRecord.track, 'quarterlyAssessment').toFixed(2);

            // Calculate initial grade and transmuted grade
            const initialGrade = (parseFloat(writtenWorksWeighted) + parseFloat(performanceTaskWeighted) + parseFloat(quarterlyAssessmentWeighted)).toFixed(2);
            const transmutedGrade = gradeMapping.find(g => initialGrade >= g.min && initialGrade <= g.max)?.transmuted || initialGrade;

            // Update student records
            student.secondQuarter.scoreRecords = {
                writtenWorks: {
                    ...writtenWorks,
                    total: totalWrittenWorks,
                    percentScore: writtenWorksPercent,
                    weightedScore: writtenWorksWeighted,
                },
                performanceTask: {
                    ...performanceTask,
                    total: totalPerformanceTask,
                    percentScore: performanceTaskPercent,
                    weightedScore: performanceTaskWeighted,
                },
                quarterlyAssessment: {
                    ...quarterlyAssessment,
                    score: totalQuarterlyAssessment,
                    percentScore: quarterlyAssessmentPercent,
                    weightedScore: quarterlyAssessmentWeighted,
                },
                initialGrade: parseFloat(initialGrade),
                quarterlyGrade: parseFloat(transmutedGrade),
            };

            // Compute Final Semester Grade
            const firstQuarterGrade = student.firstQuarter?.scoreRecords?.quarterlyGrade || null;
            let finalGrade = null;
            let remarks = "Failed";

            if (firstQuarterGrade !== null) {
                finalGrade = Math.round((firstQuarterGrade + parseFloat(transmutedGrade)) / 2) || 0;
                remarks = finalGrade < 75 ? "Failed" : "Passed";
            }

            student.finalSemesterGrade = {
                firstQuarter: firstQuarterGrade,
                secondQuarter: parseFloat(transmutedGrade),
                finalGrade,
                remarks,
            };
        } else {
            return res.status(400).json({ message: "Second quarter data is missing" });
        }

        await classRecord.save();

        return res.status(200).json({
            success: true,
            message: "Class record updated successfully",
            classRecord,
        });
    } catch (error) {
        console.error("Error in updateSecondQuarter:", error);
        return next(new ErrorHandler("Internal Server Error", 500));
    }
};

exports.updatePossibleScoresSQ = async (req, res, next) => {
    const { classRecordId } = req.params;
    const { possibleScores } = req.body;

    try {
        const classRecord = await ClassRecordModel.findById(classRecordId).select("-students.generalAverage");
        if (!classRecord) {
            return res.status(404).json({ message: "Class record not found" });
        }

        // Check if possible scores are missing or incomplete
        if (!possibleScores || !possibleScores.writtenWorks || !possibleScores.performanceTask || possibleScores.quarterlyGrade == null) {
            return res.status(400).json({ message: "Possible scores are missing or incomplete" });
        }

        classRecord.secondQuarterPossibleScores = possibleScores;

        // Safe reduce to handle empty or invalid arrays
        const safeReduce = (array, reducer, initialValue) =>
            Array.isArray(array) && array.length > 0 ? array.reduce(reducer, initialValue) : initialValue;

        // Safe division to avoid division by zero
        const safeDivision = (numerator, denominator) => (denominator > 0 ? numerator / denominator : 0);

        // Iterate through students and update their scores
        for (let student of classRecord.students) {
            const { writtenWorks, performanceTask, quarterlyAssessment } = student.secondQuarter.scoreRecords;

            // Check if there is any data in scores
            const noDataInScores = [
                ...(writtenWorks?.scores || []),
                ...(performanceTask?.scores || []),
                quarterlyAssessment?.score
            ].some(score => score === null || score === undefined || score === 0);

            if (noDataInScores) {
                // No data in scores, set to null
                student.secondQuarter.scoreRecords = {
                    writtenWorks: {
                        ...writtenWorks,
                        total: 0,
                        percentScore: 0,
                        weightedScore: 0,
                        scores: writtenWorks?.scores || []
                    },
                    performanceTask: {
                        ...performanceTask,
                        total: 0,
                        percentScore: 0,
                        weightedScore: 0,
                        scores: performanceTask?.scores || []
                    },
                    quarterlyAssessment: {
                        ...quarterlyAssessment,
                        percentScore: 0,
                        weightedScore: 0,
                        score: 0
                    },
                    initialGrade: 0,
                    quarterlyGrade: null,
                };

                student.finalSemesterGrade = {
                    firstQuarter: student.firstQuarter?.scoreRecords?.quarterlyGrade || null,
                    secondQuarter: null,
                    finalGrade: null,
                    remarks: "Failed",
                };

                continue;
            }

            // Calculate total scores safely
            const totalWrittenWorks = safeReduce(writtenWorks.scores, (a, b) => a + b, 0);
            const totalPerformanceTask = safeReduce(performanceTask.scores, (a, b) => a + b, 0);
            const totalQuarterlyAssessment = quarterlyAssessment.score;

            const totalPossibleWrittenWorks = safeReduce(possibleScores.writtenWorks, (a, b) => a + b, 0);
            const totalPossiblePerformanceTask = safeReduce(possibleScores.performanceTask, (a, b) => a + b, 0);
            const totalPossibleQuarterlyAssessment = possibleScores.quarterlyGrade;

            // Calculate percent scores
            const writtenWorksPercentScore = parseFloat(
                (safeDivision(totalWrittenWorks, totalPossibleWrittenWorks) * 100).toFixed(2)
            );
            const performanceTaskPercentScore = parseFloat(
                (safeDivision(totalPerformanceTask, totalPossiblePerformanceTask) * 100).toFixed(2)
            );
            const quarterlyAssessmentPercentScore = parseFloat(
                (safeDivision(totalQuarterlyAssessment, totalPossibleQuarterlyAssessment) * 100).toFixed(2)
            );

            // Calculate weighted scores
            const writtenWorksWeightedScore = parseFloat(
                calculateWeightedScore(writtenWorksPercentScore, classRecord.track, "writtenWorks").toFixed(2)
            );
            const performanceTaskWeightedScore = parseFloat(
                calculateWeightedScore(performanceTaskPercentScore, classRecord.track, "performanceTask").toFixed(2)
            );
            const quarterlyAssessmentWeightedScore = parseFloat(
                calculateWeightedScore(quarterlyAssessmentPercentScore, classRecord.track, "quarterlyAssessment").toFixed(2)
            );

            const initialGrade = parseFloat(
                (writtenWorksWeightedScore + performanceTaskWeightedScore + quarterlyAssessmentWeightedScore).toFixed(2)
            );

            // Default transmuted grade to initialGrade
            let transmutedGrade = initialGrade;
            if (!noDataInScores) {
                transmutedGrade =
                    gradeMapping.find((g) => initialGrade >= g.min && initialGrade <= g.max)?.transmuted || initialGrade;
            }

            // Update second quarter score records
            student.secondQuarter.scoreRecords = {
                writtenWorks: { ...writtenWorks, total: totalWrittenWorks, percentScore: writtenWorksPercentScore, weightedScore: writtenWorksWeightedScore },
                performanceTask: { ...performanceTask, total: totalPerformanceTask, percentScore: performanceTaskPercentScore, weightedScore: performanceTaskWeightedScore },
                quarterlyAssessment: { ...quarterlyAssessment, percentScore: quarterlyAssessmentPercentScore, weightedScore: quarterlyAssessmentWeightedScore },
                initialGrade: isNaN(initialGrade) ? 0 : initialGrade,
                quarterlyGrade: isNaN(transmutedGrade) ? 0 : transmutedGrade,
            };

            const firstQuarterGrade = student.firstQuarter?.scoreRecords?.quarterlyGrade || null;

            // Calculate the final grade and determine remarks based on the transmuted grade
            if (firstQuarterGrade !== null) {
                const finalGrade = Math.round((firstQuarterGrade + transmutedGrade) / 2);
                const remarks = finalGrade < 75 ? "Failed" : "Passed";

                student.finalSemesterGrade = {
                    firstQuarter: firstQuarterGrade,
                    secondQuarter: transmutedGrade,
                    finalGrade,
                    remarks,
                };
            } else {
                student.finalSemesterGrade = {
                    firstQuarter: firstQuarterGrade,
                    secondQuarter: transmutedGrade,
                    finalGrade: null,
                    remarks: "Failed",
                };
            }
        }

        await classRecord.save();

        return res.status(200).json({
            success: true,
            message: "Successfully set second quarter possible scores",
            classRecord,
        });
    } catch (error) {
        console.error("Error in updatePossibleScoresSQ:", error);
        return next(new ErrorHandler("Internal Server Error", 500));
    }
};

//** Final grade */
exports.getClassCard = async (req, res, next) => {
    try {
        const { sectionId, lrn } = req.params;

        // Query for 1st Semester data
        const query1stSemester = {
            softDelete: false,
            ...(sectionId && { section: sectionId }),
        };

        const ecrs1stSemester = await ClassRecordModel.find(query1stSemester)
            .populate('section')
            .populate({
                path: 'section',
                populate: [
                    { path: 'sectionId', model: 'FormOne' },
                    { path: 'adviser', select: 'firstName middleName lastName suffix', model: 'User' }
                ]
            })
            .populate('teachers');


        if (ecrs1stSemester.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No class records found for the specified section (1st Semester)",
            });
        }

        // Get section data for 1st semester
        const sectionData1stSemester = ecrs1stSemester[0]?.section
            ? {
                region: ecrs1stSemester[0].section.region,
                schoolName: ecrs1stSemester[0].section.schoolName,
                division: ecrs1stSemester[0].section.division,
                schoolId: ecrs1stSemester[0].section.schoolId,
                schoolYear: ecrs1stSemester[0].section.schoolYear,
                gradeLevel: ecrs1stSemester[0].section.gradeLevel,
                adviser: ecrs1stSemester[0].section.adviser
                    ? {
                        firstName: ecrs1stSemester[0].section.adviser.firstName,
                        middleName: ecrs1stSemester[0].section.adviser.middleName,
                        lastName: ecrs1stSemester[0].section.adviser.lastName,
                        suffix: ecrs1stSemester[0].section.adviser.suffix,
                    }
                    : null,
                trackStrand: ecrs1stSemester[0].section.trackStrand,
                semester: ecrs1stSemester[0].section.semester,
                section: ecrs1stSemester[0].section.section,
                sectionId: ecrs1stSemester[0].section.sectionId?.semester || null,
                course: ecrs1stSemester[0].section.course,
            }
            : null;

        // Find the student in the 1st semester records
        const studentRecord1stSemester = ecrs1stSemester.flatMap(ecr =>
            ecr.students.find(student => student.lrn === lrn)
        )[0];

        if (!studentRecord1stSemester) {
            return res.status(404).json({
                success: false,
                message: "Student not found in this section (1st Semester)",
            });
        }

        // Get the sectionId from the 1st Semester for querying the 2nd Semester
        const sectionId2ndSemester = ecrs1stSemester[0]?.section?.sectionId;

        // Query for 2nd Semester data
        const ecrs2ndSemester = sectionId2ndSemester
            ? await ClassRecordModel.find({
                softDelete: false,
                section: sectionId2ndSemester,
            })
                .populate('section')
                .populate({
                    path: "section",
                    populate: { path: "sectionId", model: "FormOne" },
                })
                .populate('teachers')
            : [];

        // Define the categories for classification
        const validCategories = [
            "Core",
            "Applied",
            "Specialized"
        ];

        const gradesData = {
            "1st Semester": { coreSubjects: [], appliedSpecializedSubjects: [] },
            "2nd Semester": { coreSubjects: [], appliedSpecializedSubjects: [] },
        };

        const processGrades = (ecrs, semester) => {
            ecrs.forEach(ecr => {
                ecr.students.forEach(student => {
                    if (student.lrn !== lrn) return;

                    if (!validCategories.includes(ecr.category)) return;

                    const gradeInfo = {
                        subject: ecr.subject,
                        category: ecr.category,
                        order: ecr.order,
                        teacher: {
                            firstName: ecr.teachers?.firstName || "",
                            middleName: ecr.teachers?.middleName || "",
                            lastName: ecr.teachers?.lastName || "",
                            suffix: ecr.teachers?.suffix || "",
                        },
                        firstQuarter: student.firstQuarter?.scoreRecords || null,
                        secondQuarter: student.secondQuarter?.scoreRecords || null,
                        finalGrade: student.finalSemesterGrade?.finalGrade || null,
                        remarks: student.finalSemesterGrade?.finalGrade !== null
                            ? (student.finalSemesterGrade.finalGrade >= 75 ? "Passed" : "Failed")
                            : "No grades available",
                    };

                    if (ecr.category === "Core") {
                        gradesData[semester].coreSubjects.push(gradeInfo);
                    } else if (["Applied", "Specialized"].includes(ecr.category)) {
                        gradesData[semester].appliedSpecializedSubjects.push(gradeInfo);
                    }
                });
            });

            gradesData[semester].coreSubjects.sort((a, b) => a.order - b.order);
            gradesData[semester].appliedSpecializedSubjects.sort((a, b) => a.order - b.order);
        };


        processGrades(ecrs1stSemester, "1st Semester");
        processGrades(ecrs2ndSemester, "2nd Semester");

        const calculateGeneralAverage = semester => {
            const totalGrades = gradesData[semester].coreSubjects.reduce((acc, grade) => acc + (grade.finalGrade || 0), 0);
            const count = gradesData[semester].coreSubjects.length;

            if (count === 0) return { average: "No grades available", remarks: "No grades available" };

            const average = Math.round(totalGrades / count);
            return {
                average,
                remarks: average >= 75 ? "Passed" : "Failed",
            };
        };

        const generalAverage1stSemester = calculateGeneralAverage("1st Semester");
        const generalAverage2ndSemester = calculateGeneralAverage("2nd Semester");

        const update = {
            $set: {
                "students.$[elem].generalAverage": {
                    firstSemester: generalAverage1stSemester.average,
                    secondSemester: generalAverage2ndSemester.average,
                },
                "students.$[elem].generalAverageRemarks": {
                    firstSemester: generalAverage1stSemester.remarks,
                    secondSemester: generalAverage2ndSemester.remarks,
                },
            },
        };

        await ClassRecordModel.updateOne(
            { _id: ecrs1stSemester[0]._id },
            update,
            { arrayFilters: [{ "elem.lrn": lrn }] }
        );

        return res.status(200).json({
            success: true,
            message: "Class record data for student in the section",
            section: sectionData1stSemester,
            student: {
                firstName: studentRecord1stSemester.firstName,
                middleName: studentRecord1stSemester.middleName,
                lastName: studentRecord1stSemester.lastName,
                suffix: studentRecord1stSemester.suffix,
                sex: studentRecord1stSemester.sex,
                age: studentRecord1stSemester.age,
                lrn: studentRecord1stSemester.lrn,
                generalAverage: {
                    firstSemester: generalAverage1stSemester,
                    secondSemester: generalAverage2ndSemester,
                },
            },
            grades: gradesData,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.arrangeSubjects = async (req, res) => {
    try {
        const { newArrangement } = req.body;

        // Ensure updatedOrder is an array and contains valid objects
        if (!Array.isArray(newArrangement) || newArrangement.length === 0) {
            return res.status(400).json({ message: "Invalid or empty updatedOrder." });
        }

        // Update each record with the new order
        const updatePromises = newArrangement.map((item) =>
            ClassRecordModel.findByIdAndUpdate(item.id, { order: item.order }, { new: true })
        );

        // Wait for all updates to complete
        const updatedRecords = await Promise.all(updatePromises);

        // Check if any record was not updated (optional)
        if (updatedRecords.some(record => !record)) {
            return res.status(404).json({ message: "Some records were not found or updated." });
        }

        res.status(200).json({
            message: "New arrangement!"
        });
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

//** Teacher */
exports.ecrSectionList = async (req, res, next) => {
    try {
        const { sectionId } = req.params;

        const query = { teachers: req.user._id };
        if (sectionId) {
            query.section = sectionId;
        }

        const ercs = await ClassRecordModel.find(query).populate([
            { path: 'section' },
            { path: 'teachers', select: 'firstName middleName lastName suffix' }
        ]);

        if (ercs.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No class records found for the specified section or teacher.",
                ercs: [],
                totalErcs: 0,
            });
        }

        // Helper function to replace 0 with blank strings recursively
        const replaceZerosWithNull = (obj, visited = new WeakSet()) => {
            if (visited.has(obj)) return; // Prevent infinite recursion
            if (typeof obj === 'object' && obj !== null) {
                visited.add(obj); // Mark the current object as visited
                for (const key in obj) {
                    if (typeof obj[key] === 'object' && obj[key] !== null) {
                        replaceZerosWithNull(obj[key], visited);
                    } else if (obj[key] === 0) {
                        obj[key] = null; // Replace 0 with null
                    }
                }
            }
        };


        // Helper function to validate and clean quarterlyGrade
        const cleanQuarterlyGrades = (obj, visited = new WeakSet()) => {
            if (visited.has(obj)) return; // Prevent infinite recursion
            if (typeof obj === 'object' && obj !== null) {
                visited.add(obj); // Mark the current object as visited
                for (const key in obj) {
                    // Skip processing for `firstQuarterPossibleScores`
                    if (key === 'firstQuarterPossibleScores') continue;

                    if (key === 'quarterlyGrade' && typeof obj[key] === 'number') {
                        // Check if there are no scores in related fields
                        const hasScores = ['writtenWorks', 'performanceTask', 'quarterlyAssessment']
                            .some(field => obj[field]?.scores?.length > 0);

                        if (!hasScores) {
                            obj[key] = "";
                        }
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        cleanQuarterlyGrades(obj[key], visited);
                    }
                }
            }
        };

        // Modify ercs to replace 0 values with blanks and clean quarterlyGrade
        ercs.forEach(erc => {
            replaceZerosWithNull(erc);
            cleanQuarterlyGrades(erc);
        });


        res.status(200).json({
            success: true,
            ercs,
            totalErcs: ercs.length,
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

//** Admin */
exports.adminSectionList = async (req, res, next) => {
    try {
        const { sectionId } = req.params;

        const query = sectionId ? { section: sectionId, softDelete: false } : { softDelete: false };
        const ercs = await ClassRecordModel.find(query).populate([
            { path: 'section' },
            { path: 'teachers', select: 'firstName middleName lastName suffix' }
        ]);

        if (ercs.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No class record found for the specified section",
                ercs: [],
                totalErcs: 0,
            });
        }

        res.status(200).json({
            success: true,
            ercs,
            totalErcs: ercs.length,
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.adminAllSectionClassRecords = async (req, res, next) => {
    try {
        const classRecords = await ClassRecordModel.find({ softDelete: false }).populate([
            { path: 'section' },
            { path: 'teachers', select: 'firstName middleName lastName suffix' }
        ]);;

        if (classRecords.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No form one found",
                classRecords: [],
                totalRecords: 0,
            });
        }

        res.status(200).json({
            success: true,
            classRecords,
            totalRecords: classRecords.length,
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.softDeleteClassRecord = async (req, res, next) => {
    try {
        const { classRecordId } = req.params;

        if (!mongoose.isValidObjectId(classRecordId)) {
            return next(new ErrorHandler("Invalid class record ID", 400));
        }

        const classRecord = await ClassRecordModel.findById(classRecordId);
        if (!classRecord) {
            return next(new ErrorHandler("Class record not found", 404));
        }

        if (classRecord.softDelete) {
            return next(new ErrorHandler("Class record has already been deleted", 400));
        }

        const user = req.user;

        classRecord.softDelete = true;
        classRecord.deletedAt = new Date();
        classRecord.deletedBy = {
            fullname: `${user.lastName} ${user.firstName}`,
            role: user.role
        };

        await classRecord.save();

        return res.status(200).json({
            success: true,
            message: "Class record deleted successfully",
            classRecord
        });

    } catch (error) {
        console.error("Error in classRecordDelete:", error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.listInactiveClassRecords = async (req, res, next) => {
    try {
        const { sectionId } = req.params;

        const query = sectionId ? { section: sectionId, softDelete: true } : { softDelete: false };
        const ercs = await ClassRecordModel.find(query).populate([
            { path: 'section' },
            { path: 'teachers', select: 'firstName middleName lastName suffix' }
        ]);

        if (ercs.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No class record found for the specified section",
                ercs: [],
                totalErcs: 0,
            });
        }

        res.status(200).json({
            success: true,
            ercs,
            totalErcs: ercs.length,
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.restoreClassRecord = async (req, res, next) => {
    try {
        const { classRecordId } = req.params;

        if (!mongoose.isValidObjectId(classRecordId)) {
            return next(new ErrorHandler("Invalid record ID", 400));
        }

        const classRecord = await ClassRecordModel.findById(classRecordId);
        if (!classRecord) {
            return next(new ErrorHandler("Class record not found", 404));
        }

        if (!classRecord.softDelete) {
            return next(new ErrorHandler("Class record is already active", 400));
        }

        const user = req.user;

        if (!user || !user.firstName || !user.lastName || !user.role) {
            return next(new ErrorHandler("User information is incomplete", 400));
        }

        classRecord.softDelete = false;
        classRecord.restoredAt = new Date();
        classRecord.restoredBy = {
            fullname: `${user.lastName} ${user.firstName}`,
            role: user.role
        };
        classRecord.deletedAt = null;

        await classRecord.save();

        return res.status(200).json({
            success: true,
            message: "Class record restored successfully",
            classRecord
        });

    } catch (error) {
        console.error("Error in restoreClassRecord:", error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};