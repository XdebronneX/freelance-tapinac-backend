const mongoose = require("mongoose")

const formOneSchema = new mongoose.Schema({
    adviser: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
    schoolName: {
        type: String,
        required: true
    },
    schoolId: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    division: {
        type: String,
        required: true
    },
    region: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    schoolYear: {
        type: String,
        required: true
    },
    gradeLevel: {
        type: String,
        required: true
    },
    trackStrand: {
        type: String,
    },
    section: {
        type: String,
        required: true,
    },
    sectionId: {
        type: mongoose.Types.ObjectId,
        ref: 'FormOne'
    },
    course: {
        type: String,
    },
    is2ndsemesterCreated: {
        type: Boolean,
        default: false,
        index: true
    },
    students: [{
        lrn: {
            type: String,
        },
        firstName: {
            type: String,
        },
        middleName: {
            type: String,
        },
        lastName: {
            type: String,
        },
        sex: {
            type: String,
        },
        birthDate: {
            type: Date,
        },
        age: {
            type: Number,
        },
        religiousAffiliation: {
            type: String,
        },
        completeAddress: {
            houseNo: {
                type: String
            },
            barangay: {
                type: String,
            },
            city: {
                type: String,
            },
            province: {
                type: String,
            },
        },
        parents: {
            fatherInfo: {
                firstName: {
                    type: String,
                },
                middleName: {
                    type: String,
                },
                lastName: {
                    type: String,
                },
                suffix: {
                    type: String,
                },
            },
            motherInfo: {
                firstName: {
                    type: String,
                },
                middleName: {
                    type: String,
                },
                lastName: {
                    type: String,
                },
                suffix: {
                    type: String,
                },
            },
        },
        guardianInfo: {
            firstName: {
                type: String,
            },
            middleName: {
                type: String,
            },
            lastName: {
                type: String,
            },
            suffix: {
                type: String,
            },
            relationship: {
                type: String,
            }
        },
        contactNumber: {
            type: String,
        },
        remarks: {
            type: String,
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
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

module.exports = mongoose.model('FormOne', formOneSchema);