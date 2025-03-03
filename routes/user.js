const express = require('express');
const router = express.Router();
const { addUser, login, getProfile, updateProfile, getUserDetails, updateUser, userlist, softDeleteUser, listInactiveUsers, restoreUser } = require("../controllers/userController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const upload = require("../utils/multer");

/**
 * Routes for user management
 */

// User login
router.post('/auth/login', login);

router.get('/me', isAuthenticatedUser, getProfile);

router.put('/me/update', isAuthenticatedUser, upload.single('avatar'), updateProfile);

router.get('/userlist', isAuthenticatedUser, authorizeRoles("registrar", "hr", "teacher", "admin", "super admin"), userlist);
router.get('/users/inactive', isAuthenticatedUser, authorizeRoles("admin", "super admin"), listInactiveUsers);

router.route('/users/:id').get(isAuthenticatedUser, authorizeRoles("super admin"), getUserDetails)

router.route('/update/users/:id').put(isAuthenticatedUser, authorizeRoles("super admin"), updateUser)

router.post('/users', isAuthenticatedUser, authorizeRoles("super admin"), addUser);

router.put('/users/:userId/deactivate', isAuthenticatedUser, authorizeRoles("super admin"), softDeleteUser);

router.put('/users/:userId/reactivate', isAuthenticatedUser, authorizeRoles("super admin"), restoreUser);

module.exports = router;
