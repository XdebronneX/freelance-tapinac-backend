const mongoose = require("mongoose")

const studentSchema = new mongoose.Schema({
    lrn: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
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
    sex: {
        type: String,
        required: true
    },
    birthDate: {
        type: Date,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    religiousAffiliation: {
        type: String,
        required: true
    },
    completeAddress: {
        houseNo: {
            type: String,
            required: true
        },
        barangay: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        province: {
            type: String,
            required: true
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
        required: true,
    },
    remarks: {
        type: String,
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
    }
})

module.exports = mongoose.model('Student', studentSchema);