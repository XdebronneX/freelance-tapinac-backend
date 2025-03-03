const express = require('express');
const router = express.Router();
const {
    getStudents,
    getSingleStudent,
    listActiveStudents,
    listInactiveStudents,
    createStudent,
    updateStudent,
    softDeleteStudent,
    restoreStudent
} = require("../controllers/studentController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

/**
 * Routes for student management
 */

// Get all students
router.get('/studentList', isAuthenticatedUser, authorizeRoles("registrar", "hr", "teacher", "admin", "super admin"), getStudents);
router.get('/singleStudent/:studentId', isAuthenticatedUser, authorizeRoles("registrar", "hr", "teacher", "admin", "super admin"), getSingleStudent);
router.get('/students/inactive', isAuthenticatedUser, authorizeRoles("registrar", "hr", "teacher", "admin", "super admin"), listInactiveStudents);
router.get('/students/active', isAuthenticatedUser, authorizeRoles("registrar", "hr", "teacher", "admin", "super admin"), listActiveStudents);

router.post('/students', isAuthenticatedUser, authorizeRoles("registrar", "admin", "super admin"), createStudent);

router.put('/students/:studentId', isAuthenticatedUser, authorizeRoles("registrar", "admin", "super admin"), updateStudent);
router.put('/students/:studentId/deactivate', isAuthenticatedUser, authorizeRoles("admin", "super admin"), softDeleteStudent);
router.put('/students/:studentId/reactivate', isAuthenticatedUser, authorizeRoles("admin", "super admin"), restoreStudent);

module.exports = router;
