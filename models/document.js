// const mongoose = require("mongoose");

// const documentSchema = new mongoose.Schema({
//     sendTo: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//     },
//     trackingNumber: {
//         type: String,
//         unique: true,
//         required: true,
//     },
//     documentName: {
//         data: Buffer,
//         contentType: String,
//         filename: String
//     },
//     documentStatus: [
//         {
//             status: {
//                 type: String,
//                 default: 'Pending'
//             },
//             timestamp: {
//                 type: Date,
//                 default: Date.now
//             }
//         }
//     ],
//     remarks: {
//         type: String,
//         default: null
//     },
// }, 
// {
//     timestamps: true
// });

// module.exports = mongoose.model('Document', documentSchema);

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    sendTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sendBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    trackingNumber: {
        type: String,
        required: true,
        unique: true
    },
    documentName: {
        data: {
            type: Buffer,
            required: true
        },
        contentType: {
            type: String,
            required: true
        },
        filename: {
            type: String,
            required: true
        }
    },
    documentStatus: [
        {
            updatedBy:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            filename: {
                type: String,
                required: true
            },
            status: {
                type: String,
                enum: ['Pending', 'Received', 'For Releasing'],
                default: 'Pending'
            },
            updatedAt: {
                type: Date,
                default: Date.now
            },
            remarks: {
                type: String,
                default: ''
            },
        }
    ],
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

module.exports = mongoose.model('Document', documentSchema);