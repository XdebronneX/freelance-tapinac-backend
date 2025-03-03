const mongoose = require("mongoose");

const ecrSchema = new mongoose.Schema({
    teachers: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
    },
    subject: {
        type: String,
    },
    order: {
        type: Number,
    },
    track: {
        type: String,
        required: true
    },
    section: {
        type: mongoose.Types.ObjectId,
        ref: 'FormOne',
        required: true
    },
    firstQuarterPossibleScores: {
        writtenWorks: [{
            type: Number,
        }],
        performanceTask: [{
            type: Number,
        }],
        quarterlyGrade: {
            type: Number,
        },
    },
    secondQuarterPossibleScores: {
        writtenWorks: [{
            type: Number,
        }],
        performanceTask: [{
            type: Number,
        }],
        quarterlyGrade: {
            type: Number,
        },
    },
    
    students: [{
        lrn: {
            type: String,
        },
        firstName: {
            type: String,
        },
        middleName: {
            type: String
        },
        lastName: {
            type: String,
        },
        suffix: {
            type: String
        },
        sex: {
            type: String,
        },
        age: {
            type: Number,
        },
        firstQuarter: {
            scoreRecords: {
                writtenWorks: {
                    percentScore: {
                        type: Number,
                    },
                    weightedScore: {
                        type: Number,
                    },
                    total: {
                        type: Number,
                    },
                    scores: [{
                        type: Number,
                    }]
                },
                performanceTask: {
                    percentScore: {
                        type: Number,
                    },
                    weightedScore: {
                        type: Number,
                    },
                    total: {
                        type: Number,
                    },
                    scores: [{
                        type: Number,
                    }]
                },
                quarterlyAssessment: {
                    percentScore: {
                        type: Number,
                    },
                    weightedScore: {
                        type: Number,
                    },
                    score: {
                        type: Number,
                    }
                },
                initialGrade: {
                    type: Number,
                },
                quarterlyGrade: {
                    type: Number,
                },
            }
        },
        secondQuarter: {
            scoreRecords: {
                writtenWorks: {
                    percentScore: {
                        type: Number,
                    },
                    weightedScore: {
                        type: Number,
                    },
                    total: {
                        type: Number,
                    },
                    scores: [{
                        type: Number,
                    }]
                },
                performanceTask: {
                    percentScore: {
                        type: Number,
                    },
                    weightedScore: {
                        type: Number,
                    },
                    total: {
                        type: Number,
                    },
                    scores: [{
                        type: Number,
                    }]
                },
                quarterlyAssessment: {
                    percentScore: {
                        type: Number,
                    },
                    weightedScore: {
                        type: Number,
                    },
                    score: {
                        type: Number,
                    }
                },
                initialGrade: {
                    type: Number,
                },
                quarterlyGrade: {
                    type: Number,
                }
            }
        },
        finalSemesterGrade: {
            firstQuarter: {
                type: Number,
            },
            secondQuarter: {
                type: Number,
            },
            finalGrade: {
                type: Number,
            },
            remarks: {
                type: String
            }
        },
        generalAverage: {
            firstSemester: {
                average: {
                    type: Number
                },
                remarks: {
                    type: String
                }
            },
            secondSemester: {
                average: {
                    type: Number
                },
                remarks: {
                    type: String
                }
            },
        },
    }],
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
});

module.exports = mongoose.model('ClassRecord', ecrSchema);
