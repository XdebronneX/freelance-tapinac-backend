const ErrorHandler = require("../utils/errorHandler");
const DocumentModel = require("../models/document");
const path = require("path");
const mongoose = require("mongoose");
const moment = require("moment-timezone");

const generateTrackingNumber = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.createDocument = async (req, res, next) => {
    try {
        // Check if file is uploaded
        if (!req.file) {
            return next(new ErrorHandler("File is required for documentName", 400));
        }

        // Check the file type (optional check)
        const allowedMimeTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return next(new ErrorHandler("Unsupported file type!", 400));
        }

        // Prepare documentName with uploaded file details
        const documentName = {
            data: req.file.buffer,
            contentType: req.file.mimetype,
            filename: req.file.originalname,
        };

        // Generate a unique tracking number
        const trackingNumber = generateTrackingNumber();

        // Extract sendTo from request body
        const { sendTo } = req.body;

        // Ensure recipient is provided
        if (!sendTo) {
            return next(new ErrorHandler("Recipient (sendTo) is required", 400));
        }

        // Create document with initial 'Pending' status
        const document = await DocumentModel.create({
            trackingNumber,
            documentName,
            documentStatus: [{
                updatedBy: req.user.id,
                status: 'Pending',
                filename: req.file.originalname, // Add the filename to the status
                remarks: '', // Initial remark for "Pending"
            }],
            sendTo,
            sendBy: req.user.id, // Assuming user information is stored in req.user.id
        });

        // Prepare the response with document data
        const documentResponse = {
            ...document._doc,
            documentName: document.documentName ? {
                contentType: document.documentName.contentType,
                filename: document.documentName.filename,
                data: document.documentName.data ? document.documentName.data.toString('base64') : undefined,
            } : undefined
        };

        // Respond with the created document data
        res.status(201).json({
            success: true,
            document: documentResponse,
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Error while creating document", 500));
    }
};

exports.updateDocument = async (req, res, next) => {
    const { documentId } = req.params;
    const { documentStatus, remarks } = req.body;

    try {
        const document = await DocumentModel.findById(documentId);
        if (!document) {
            return next(new ErrorHandler(`Document not found with id: ${documentId}`, 404));
        }

        // Find the last status before the new update to get its remarks
        let previousRemarks = '';
        if (document.documentStatus.length > 0) {
            const lastStatus = document.documentStatus[document.documentStatus.length - 1];
            previousRemarks = lastStatus.remarks || ''; // Get the remarks from the last status
        }

        // If a new file is uploaded, update the documentName field
        if (req.file) {
            const updatedDocumentName = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
                filename: req.file.originalname,
            };

            // Update the document's documentName
            document.documentName = updatedDocumentName;
        }

        // Always push a new status entry to the documentStatus array
        document.documentStatus.push({
            updatedBy: req.user.id,
            status: documentStatus || 'Pending', // Default to 'Pending' if no status provided
            filename: req.file ? req.file.originalname : document.documentName.filename, // Use the new filename if a new file is uploaded
            remarks: remarks || '', // Default to empty string if no remarks provided
        });

        // Save the updated document
        await document.save();

        const documentResponse = {
            ...document._doc,
            documentName: document.documentName ? {
                contentType: document.documentName.contentType,
                filename: document.documentName.filename,
                data: document.documentName.data ? document.documentName.data.toString('base64') : undefined,
            } : undefined,
        };

        // Respond with the updated document and previous remarks
        res.status(200).json({
            success: true,
            previousRemarks, // Send the previous remarks
            document: documentResponse,
        });

    } catch (error) {
        console.error('Error while updating document:', error);
        return next(new ErrorHandler("Error while updating document", 500));
    }
};

exports.receivedDocument = async (req, res, next) => {
    const { documentId } = req.params;

    try {
        const document = await DocumentModel.findById(documentId);
        if (!document) {
            return next(new ErrorHandler(`Document not found with id: ${documentId}`, 404));
        }

        // Find the last status before "Received" and get its remarks
        let previousRemarks = '';
        let previousFilename = document.documentName.filename; // Default to the current filename
        for (let i = document.documentStatus.length - 1; i >= 0; i--) {
            const status = document.documentStatus[i];
            if (status.status !== 'Received') {
                previousRemarks = status.remarks || ''; // Get previous remarks
                previousFilename = status.filename || previousFilename; // Get previous filename
                break; // Stop once we find the previous status
            }
        }

        // Update document status to 'Received'
        document.documentStatus.push({
            updatedBy: req.user.id,
            status: 'Received',
            updatedAt: Date.now(),
            remarks: previousRemarks, // Set previous remarks as the remarks for 'Received' status
            filename: previousFilename, // Set the previous filename in the document status
        });

        // Save the updated document
        await document.save();

        res.status(200).json({
            success: true,
            document: {
                ...document._doc,
                documentName: document.documentName ? {
                    contentType: document.documentName.contentType,
                    filename: document.documentName.filename,
                    data: document.documentName.data ? document.documentName.data.toString('base64') : undefined,
                } : undefined,
            },
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Error while updating document status", 500));
    }
};

exports.releaseDocument = async (req, res, next) => {
    const { documentId } = req.params;

    try {
        const document = await DocumentModel.findById(documentId);
        if (!document) {
            return next(new ErrorHandler(`Document not found with id: ${documentId}`, 404));
        }

        // Find the last status before "For Releasing" and get its remarks
        let previousRemarks = '';
        let previousFilename = document.documentName.filename; // Default to the current filename
        for (let i = document.documentStatus.length - 1; i >= 0; i--) {
            const status = document.documentStatus[i];
            if (status.status !== 'For Releasing') {
                previousRemarks = status.remarks || ''; // Get previous remarks
                previousFilename = status.filename || previousFilename; // Get previous filename
                break; // Stop once we find the previous status
            }
        }

        // Update document status to 'For Releasing'
        document.documentStatus.push({
            updatedBy: req.user.id,
            status: 'For Releasing',
            updatedAt: Date.now(),
            remarks: previousRemarks, // Set previous remarks as the remarks for 'For Releasing' status
            filename: previousFilename, // Set the previous filename in the document status
        });

        // Save the updated document
        await document.save();

        res.status(200).json({
            success: true,
            document: {
                ...document._doc,
                documentName: document.documentName ? {
                    contentType: document.documentName.contentType,
                    filename: document.documentName.filename,
                    data: document.documentName.data ? document.documentName.data.toString('base64') : undefined,
                } : undefined,
            },
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Error while updating document status", 500));
    }
};

exports.downloadDocument = async (req, res, next) => {
    const { documentId } = req.params;

    try {
        const document = await DocumentModel.findById(documentId);

        if (!document || !document.documentName || !document.documentName.data) {
            return next(new ErrorHandler("Document not found", 404));
        }

        const fileExtension = path.extname(document.documentName.filename).toLowerCase();

        res.setHeader('Content-Type', document.documentName.contentType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${document.documentName.filename || 'document'}"${fileExtension}`);

        res.end(document.documentName.data);

    } catch (error) {
        console.log('Internal server error:', error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.getDocuments = async (req, res, next) => {
    try {
        const documents = await DocumentModel.find({
            $or: [{ sendTo: req.user.id }, { sendBy: req.user.id }],
            softDelete: false
        }).populate([
            {
                path: 'sendTo',
                select: 'firstName middleName lastName suffix role'
            },
            {
                path: 'sendBy',
                select: 'firstName middleName lastName suffix role'
            }
        ]);

        // Enhance documents with the latest documentStatus
        const enhancedDocuments = documents.map(document => {
            const latestStatus = document.documentStatus[document.documentStatus.length - 1];

            // Exclude documentName data and contentType from response
            const { documentName, ...documentWithoutData } = document._doc;
            const enhancedDocument = {
                ...documentWithoutData,
                documentName: {
                    filename: documentName.filename, 
                    // contentType: documentName.contentType
                },
                latestStatus: latestStatus ? {
                    updatedBy: latestStatus.updatedBy,
                    status: latestStatus.status,
                    updatedAt: latestStatus.updatedAt,
                    remarks: latestStatus.remarks
                } : null
            };

            return enhancedDocument;
        });

        res.json({
            success: true,
            documents: enhancedDocuments
        });
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Error while fetching document details", 500));
    }
};

exports.getSingleDocument = async (req, res, next) => {
    try {
        const { documentId } = req.params;

        if (!mongoose.isValidObjectId(documentId)) {
            return next(new ErrorHandler("Invalid document ID", 400));
        }

        const document = await DocumentModel.findById({
            _id: documentId,
            softDelete: false
        }).populate([
            { path: 'sendTo', select: 'firstName middleName lastName suffix role' },
            { path: 'sendBy', select: 'firstName middleName lastName suffix role' }
        ]);

        if (!document) {
            console.log(`Document not found with ID: ${documentId}`);
            return next(new ErrorHandler(`Document not found with id: ${documentId}`, 404));
        }

        const isSender = document.sendBy && document.sendBy._id.toString() === req.user.id;
        const isReceiver = document.sendTo && document.sendTo._id.toString() === req.user.id;

        if (!isSender && !isReceiver) {
            return next(new ErrorHandler("You do not have permission to view this document", 403));
        }

        const latestStatus = document.documentStatus[document.documentStatus.length - 1];

        const { documentName, ...documentWithoutData } = document._doc;

        const documentResponse = {
            ...documentWithoutData,
            documentName: {
                filename: documentName.filename,
                // contentType: documentName.contentType
            },
            latestStatus: latestStatus ? {
                updatedBy: latestStatus.updatedBy,
                status: latestStatus.status,
                updatedAt: latestStatus.updatedAt,
                remarks: latestStatus.remarks
            } : null
        };

        res.status(201).json({
            success: true,
            document: documentResponse,
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Error while fetching document details", 500));
    }
};

//Admin control
exports.softDeleteDocument = async (req, res, next) => {
    try {
        const { documentId } = req.params;

        if (!mongoose.isValidObjectId(documentId)) {
            return next(new ErrorHandler("Invalid document ID", 400));
        }

        const document = await DocumentModel.findById(documentId);
        if (!document) {
            return next(new ErrorHandler("Document not found", 404));
        }

        if (document.softDelete) {
            return next(new ErrorHandler("Document has already been deleted", 400));
        }

        const user = req.user;

        document.softDelete = true;
        document.deletedAt = new Date();
        document.deletedBy = {
            fullname: `${user.lastName} ${user.firstName}`,
            role: user.role
        };

        await document.save();

        return res.status(200).json({
            success: true,
            message: "Document deleted successfully",
        });

    } catch (error) {
        console.error("Error in softDeleteDocument:", error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.getAdminSingleDocument = async (req, res, next) => {
    try {
        const { documentId } = req.params;

        if (!mongoose.isValidObjectId(documentId)) {
            return next(new ErrorHandler("Invalid document ID", 400));
        }

        const document = await DocumentModel.findById(documentId).populate([
            { path: 'sendTo', select: 'firstName middleName lastName suffix role' },
            { path: 'sendBy', select: 'firstName middleName lastName suffix role' }
        ]);

        if (!document) {
            console.log(`Document not found with ID: ${documentId}`);
            return next(new ErrorHandler(`Document not found with id: ${documentId}`, 404));
        }

        if (document.softDelete) {
            return next(new ErrorHandler("Document has already been deleted", 400));
        }

        // Exclude documentName data and keep filename/contentType
        const { documentName, ...documentWithoutData } = document._doc;
        const documentResponse = {
            ...documentWithoutData,
            documentName: {
                filename: documentName.filename,
                // contentType: documentName.contentType
            }
        };

        res.status(200).json({
            success: true,
            document: documentResponse,
        });
    } catch (error) {
        console.log(error);
        return next(new ErrorHandler('Error while fetching document details', 500));
    }
};

exports.listActiveDocuments = async (req, res, next) => {
    try {
        const documents = await DocumentModel.find({ softDelete: false }).populate([
            { path: 'sendTo', select: 'firstName middleName lastName suffix role' },
            { path: 'sendBy', select: 'firstName middleName lastName suffix role' }
        ]);

        if (documents.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No documents found",
                documents: [],
                totalDocuments: 0,
            });
        }

        // Enhance documents with the latest documentStatus and exclude documentName data
        const enhancedDocuments = documents.map(document => {
            const latestStatus = document.documentStatus[document.documentStatus.length - 1];
            const { documentName, ...documentWithoutData } = document._doc;
            return {
                ...documentWithoutData,
                documentName: {
                    filename: documentName.filename,
                    // contentType: documentName.contentType
                },
                latestStatus: latestStatus ? {
                    updatedBy: latestStatus.updatedBy,
                    status: latestStatus.status,
                    updatedAt: latestStatus.updatedAt,
                    remarks: latestStatus.remarks
                } : null
            };
        });

        res.status(200).json({
            success: true,
            documents: enhancedDocuments,
            totalDocuments: documents.length,
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.listInactiveDocuments = async (req, res, next) => {
    try {
        const archivedDocuments = await DocumentModel.find({ softDelete: true }).populate([
            { path: 'sendTo', select: 'firstName middleName lastName suffix role' },
            { path: 'sendBy', select: 'firstName middleName lastName suffix role' }
        ]);

        // Enhance documents with the latest documentStatus and exclude documentName data
        const enhancedDocuments = archivedDocuments.map(document => {
            const latestStatus = document.documentStatus[document.documentStatus.length - 1];
            const { documentName, ...documentWithoutData } = document._doc;
            return {
                ...documentWithoutData,
                documentName: {
                    filename: documentName.filename,
                    // contentType: documentName.contentType
                },
                latestStatus: latestStatus ? {
                    updatedBy: latestStatus.updatedBy,
                    status: latestStatus.status,
                    updatedAt: latestStatus.updatedAt,
                    remarks: latestStatus.remarks
                } : null
            };
        });

        res.status(200).json({
            success: true,
            documents: enhancedDocuments,
            totalDocuments: archivedDocuments.length,
        });
    } catch (error) {
        console.error("Error while fetching archived documents:", error);
        return next(new ErrorHandler("Error while fetching archived documents", 500));
    }
};

exports.restoreDocument = async (req, res, next) => {
    try {
        const { documentId } = req.params;

        if (!mongoose.isValidObjectId(documentId)) {
            return next(new ErrorHandler("Invalid document ID", 400));
        }

        const document = await DocumentModel.findById(documentId);
        if (!document) {
            return next(new ErrorHandler("Document not found", 404));
        }

        if (!document.softDelete) {
            return next(new ErrorHandler("Document is already active", 400));
        }

        const user = req.user;

        if (!user || !user.firstName || !user.lastName || !user.role) {
            return next(new ErrorHandler("User information is incomplete", 400));
        }

        document.softDelete = false;
        document.restoredAt = new Date();
        document.restoredBy = {
            fullname: `${user.lastName} ${user.firstName}`,
            role: user.role
        };
        document.deletedAt = null;

        await document.save();

        return res.status(200).json({
            success: true,
            message: "Document restored successfully"
        });

    } catch (error) {
        console.error("Error in restoreDocument:", error);
        return next(new ErrorHandler("Internal server error", 500));
    }
};

exports.trackDocumentStatus = async (req, res, next) => {
    try {
        const { trackingNumber } = req.params;

        if (!trackingNumber) {
            return next(new ErrorHandler("Tracking number is required", 400));
        }

        const document = await DocumentModel.findOne({ trackingNumber, softDelete: false })
            .populate([
                { path: "sendTo", select: "firstName middleName lastName suffix role" },
                { path: "sendBy", select: "firstName middleName lastName suffix role" },
            ]);

        if (!document) {
            return next(new ErrorHandler("Document not found or has been deleted", 404));
        }

        const getFullName = (user) => {
            if (!user) return "Unknown";
            const { firstName, middleName, lastName, suffix } = user;
            return `${firstName || ""} ${middleName || ""} ${lastName || ""} ${suffix || ""}`.trim();
        };

        const formatDate = (date) => {
            // Convert the UTC time to Asia/Manila timezone
            return moment(date).tz("Asia/Manila").format("MM/DD/YYYY, h:mm A");
        };

        // Map document statuses with the filename coming from documentStatus
        const statuses = document.documentStatus.map((status) => ({
            trackingNumber: document.trackingNumber,
            fileName: status.filename,  // Use status.filename instead of document.documentName.filename
            date: formatDate(status.updatedAt),
            actionsTakenBy: getFullName(document.sendBy),
            actionsTaken: status.status,
            remarks: status.remarks || "",
        }));

        res.status(200).json({
            success: true,
            statuses,
        });
    } catch (error) {
        next(new ErrorHandler(error.message || "Internal Server Error", 500));
    }
};
