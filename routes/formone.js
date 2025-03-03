const express = require("express");
const router = express.Router();
const { createForm, updateForm, addStudents, getStudentlists, formoneList, softDeleteFormone, listInactiveSections, restoreFormone } = require("../controllers/formoneController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

/**
 * Routes for form one management
 */

router.get('/admin/formone/students/:formId', isAuthenticatedUser, authorizeRoles("registrar", "hr", "teacher", "admin", "super admin"), getStudentlists);
router.get('/formone', isAuthenticatedUser, authorizeRoles("registrar", "hr", "teacher", "admin", "super admin"), formoneList);
router.get('/formones/inactive', isAuthenticatedUser, authorizeRoles("admin", "super admin"), listInactiveSections);

router.post("/admin/formone", isAuthenticatedUser, authorizeRoles("registrar", "hr", "teacher", "admin", "super admin"), createForm);

router.put("/admin/formone/:formId", isAuthenticatedUser, authorizeRoles("registrar", "hr", "teacher", "admin", "super admin"), updateForm);
router.put("/admin/formone/students/:formId", isAuthenticatedUser, authorizeRoles("registrar", "hr", "teacher", "admin", "super admin"), addStudents);
router.put('/admin/formone/deactivate/:formId', isAuthenticatedUser, authorizeRoles("admin", "super admin"), softDeleteFormone);
router.put('/admin/formone/restore/:formId', isAuthenticatedUser, authorizeRoles("admin", "super admin"), restoreFormone);

module.exports = router;
