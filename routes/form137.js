const express = require("express");
const router = express.Router();
const { createForm137ForGrade11, createForm137ForGrade12, getSingleForm137, listActiveForm137, listInactiveForm137, 
    softDeleteForm137, restoreForm137, getForm137ForStudent, getStudentGrade11AndGrade12 
} = require("../controllers/form137Controller");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

/**
 * Routes for form one management
 */
router.get("/form137/:lrn", isAuthenticatedUser, authorizeRoles("registrar", "teacher", "admin", "super admin"), getStudentGrade11AndGrade12);
// router.get("/form137/:sectionIdGrade11/:sectionIdGrade12/:lrn", isAuthenticatedUser, authorizeRoles("registrar", "teacher", "admin", "super admin"), getForm137ForStudent);
// router.post("/form137/:sectionId/:lrn", isAuthenticatedUser, authorizeRoles("registrar", "teacher", "admin", "super admin"), createForm137ForGrade11);
// router.post("/form137/:sectionId/:lrn/grade12", isAuthenticatedUser, authorizeRoles("registrar", "teacher", "admin", "super admin"), createForm137ForGrade12);
router.get('/form137/:lrn', isAuthenticatedUser, authorizeRoles("registrar", "hr", "teacher", "admin", "super admin"), getSingleForm137);

router.put("/form137/:lrn/deactivate", isAuthenticatedUser, authorizeRoles("admin", "super admin"), softDeleteForm137);
router.put("/form137/:lrn/reactivate", isAuthenticatedUser, authorizeRoles("admin", "super admin"), restoreForm137);
router.get('/forms137/inactive', isAuthenticatedUser, authorizeRoles("registrar", "hr", "teacher", "admin", "super admin"), listInactiveForm137);
router.get('/forms137/active', isAuthenticatedUser, authorizeRoles("registrar", "hr", "teacher", "admin", "super admin"), listActiveForm137);

module.exports = router;