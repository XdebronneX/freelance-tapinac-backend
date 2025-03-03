// const mongoose = require("mongoose");

// const form137Schema = new mongoose.Schema({
//     student: {
//         lrn: { type: String },
//         firstName: { type: String },
//         middleName: { type: String },
//         lastName: { type: String },
//         suffix: { type: String },
//         sex: { type: String },
//         birthDate: { type: Date },
//     },
//     gradeElevenSchoolDetails: {
//         firstSemester: {
//             subjects: [{
//                 subjectName: { type: String },
//                 subjectTrack: { type: String },
//                 finalSemesterGrade: {
//                     firstQuarter: { type: Number },
//                     secondQuarter: { type: Number },
//                     finalGrade: { type: Number },
//                     remarks: { type: String },
//                 },
//             }],
//             generalAverage: {
//                 average: { type: Number },
//                 remarks: { type: String },
//             },
//             schoolName: { type: String },
//             schoolId: { type: String },
//             gradeLevel: { type: String },
//             schoolYear: { type: String },
//             semester: { type: String },
//             trackStrand: { type: String },
//             section: { type: String },
//         },
//         secondSemester: {
//             subjects: [{
//                 subjectName: { type: String },
//                 subjectTrack: { type: String },
//                 finalSemesterGrade: {
//                     firstQuarter: { type: Number },
//                     secondQuarter: { type: Number },
//                     finalGrade: { type: Number },
//                     remarks: { type: String },
//                 },
//                 generalAverage: {
//                     average: { type: Number },
//                     remarks: { type: String },
//                 },
//             }],
//             schoolName: { type: String },
//             schoolId: { type: String },
//             gradeLevel: { type: String },
//             schoolYear: { type: String },
//             semester: { type: String },
//             trackStrand: { type: String },
//             section: { type: String },
//         },
//     },
//     gradeTwelveSchoolDetails: {
//         firstSemester: {
//             subjects: [{
//                 subjectName: { type: String },
//                 subjectTrack: { type: String },
//                 finalSemesterGrade: {
//                     firstQuarter: { type: Number },
//                     secondQuarter: { type: Number },
//                     finalGrade: { type: Number },
//                     remarks: { type: String },
//                 },
//                 generalAverage: {
//                     average: { type: Number },
//                     remarks: { type: String },
//                 },
//             }],
//             schoolName: { type: String },
//             schoolId: { type: String },
//             gradeLevel: { type: String },
//             schoolYear: { type: String },
//             semester: { type: String },
//             trackStrand: { type: String },
//             section: { type: String },
//         },
//         secondSemester: {
//             subjects: [{
//                 subjectName: { type: String },
//                 subjectTrack: { type: String },
//                 finalSemesterGrade: {
//                     firstQuarter: { type: Number },
//                     secondQuarter: { type: Number },
//                     finalGrade: { type: Number },
//                     remarks: { type: String },
//                 },
//                 generalAverage: {
//                     average: { type: Number },
//                     remarks: { type: String },
//                 },
//             }],
//             schoolName: { type: String },
//             schoolId: { type: String },
//             gradeLevel: { type: String },
//             schoolYear: { type: String },
//             semester: { type: String },
//             trackStrand: { type: String },
//             section: { type: String },
//         },
//     },
//     softDelete: { type: Boolean, default: false, index: true },
//     deletedAt: { type: Date, default: null },
//     restoredAt: { type: Date, default: null },
//     deletedBy: {
//         fullname: { type: String },
//         role: { type: String },
//     },
//     restoredBy: {
//         fullname: { type: String },
//         role: { type: String },
//     },
//     createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model('Form137', form137Schema);


const mongoose = require("mongoose");

const form137Schema = new mongoose.Schema({
    student: {
        lrn: { type: String },
        firstName: { type: String },
        middleName: { type: String },
        lastName: { type: String },
        suffix: { type: String },
        sex: { type: String },
        birthDate: { type: Date },
    },
    gradeElevenSchoolDetails: {
        firstSemester: {
            subjects: [{
                subjectName: { type: String },
                subjectTrack: { type: String },
                finalSemesterGrade: {
                    firstQuarter: { type: Number },
                    secondQuarter: { type: Number },
                    finalGrade: { type: Number },
                    remarks: { type: String },
                }
            }],
            generalAverage: {
                average: { type: Number },
                remarks: { type: String },
            },
            schoolName: { type: String },
            schoolId: { type: String },
            gradeLevel: { type: String },
            schoolYear: { type: String },
            semester: { type: String },
            trackStrand: { type: String },
            section: { type: String },
        },
        secondSemester: {
            subjects: [{
                subjectName: { type: String },
                subjectTrack: { type: String },
                finalSemesterGrade: {
                    firstQuarter: { type: Number },
                    secondQuarter: { type: Number },
                    finalGrade: { type: Number },
                    remarks: { type: String },
                },
            }],
            generalAverage: {
                average: { type: Number },
                remarks: { type: String },
            },
            schoolName: { type: String },
            schoolId: { type: String },
            gradeLevel: { type: String },
            schoolYear: { type: String },
            semester: { type: String },
            trackStrand: { type: String },
            section: { type: String },
        },
    },
    gradeTwelveSchoolDetails: {
        firstSemester: {
            subjects: [{
                subjectName: { type: String },
                subjectTrack: { type: String },
                finalSemesterGrade: {
                    firstQuarter: { type: Number },
                    secondQuarter: { type: Number },
                    finalGrade: { type: Number },
                    remarks: { type: String },
                }
            }],
            generalAverage: {
                average: { type: Number },
                remarks: { type: String },
            },
            schoolName: { type: String },
            schoolId: { type: String },
            gradeLevel: { type: String },
            schoolYear: { type: String },
            semester: { type: String },
            trackStrand: { type: String },
            section: { type: String },
        },
        secondSemester: {
            subjects: [{
                subjectName: { type: String },
                subjectTrack: { type: String },
                finalSemesterGrade: {
                    firstQuarter: { type: Number },
                    secondQuarter: { type: Number },
                    finalGrade: { type: Number },
                    remarks: { type: String },
                },
            }],
            generalAverage: {
                average: { type: Number },
                remarks: { type: String },
            },
            schoolName: { type: String },
            schoolId: { type: String },
            gradeLevel: { type: String },
            schoolYear: { type: String },
            semester: { type: String },
            trackStrand: { type: String },
            section: { type: String },
        },
    },
    softDelete: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    restoredAt: { type: Date, default: null },
    deletedBy: {
        fullname: { type: String },
        role: { type: String },
    },
    restoredBy: {
        fullname: { type: String },
        role: { type: String },
    },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Form137', form137Schema);