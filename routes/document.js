const express = require("express");
const router = express.Router();
const { createDocument, updateDocument, receivedDocument, releaseDocument,
    getDocuments, getSingleDocument, downloadDocument,
    listActiveDocuments, listInactiveDocuments, getAdminSingleDocument, 
    softDeleteDocument, restoreDocument, trackDocumentStatus
} = require("../controllers/documentController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const upload = require("../utils/multer");

/**
 * Routes for document management
 */

router.post("/document", isAuthenticatedUser, authorizeRoles("registrar", "teacher", "admin", "super admin"), upload.single('documentName'), createDocument);
router.get("/documents", isAuthenticatedUser, authorizeRoles("registrar", "teacher", "admin", "super admin"), getDocuments);
router.get("/singleDocument/:documentId", isAuthenticatedUser, authorizeRoles("registrar", "teacher", "admin", "super admin"), getSingleDocument);
router.put("/document/:documentId", isAuthenticatedUser, authorizeRoles("registrar", "teacher", "admin", "super admin"), upload.single('documentName'), updateDocument);
router.put("/document/:documentId/received", isAuthenticatedUser, authorizeRoles("registrar", "teacher", "admin", "super admin"), receivedDocument);
router.put("/document/:documentId/release", isAuthenticatedUser, authorizeRoles("registrar", "teacher", "admin", "super admin"), releaseDocument);
router.get("/document/:documentId/download", downloadDocument);
router.get("/document/status/:trackingNumber", trackDocumentStatus);

router.get("/admin/singleDocument/:documentId", isAuthenticatedUser, authorizeRoles("admin", "super admin"), getAdminSingleDocument);
router.put("/document/:documentId/deactivate", isAuthenticatedUser, authorizeRoles("admin", "super admin"), softDeleteDocument);
router.get("/document/archive", isAuthenticatedUser, authorizeRoles("admin", "super admin"), listInactiveDocuments);
router.put("/document/:documentId/reactivate", isAuthenticatedUser, authorizeRoles("admin", "super admin"), restoreDocument);
router.get("/document/active", isAuthenticatedUser, authorizeRoles("admin", "super admin"), listActiveDocuments);

module.exports = router;