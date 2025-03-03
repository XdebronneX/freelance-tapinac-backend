const express = require('express');
const router = express.Router();
const { createClassRecord, ecrSectionList, adminSectionList, 
    adminAllSectionClassRecords, getSingleEcr, 
    getClassCard, updateClassRecord, updateFirstQuarter,
    updateSecondQuarter, updatePossibleScoresFQ, updatePossibleScoresSQ,
    softDeleteClassRecord, listInactiveClassRecords, restoreClassRecord, getSingleScores, arrangeSubjects 
} = require("../controllers/ecrController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

/**
 * Routes for class record management
 */

router.post('/classRecord/:formId', isAuthenticatedUser, authorizeRoles("registrar", "admin", "super admin"), createClassRecord);

router.get('/singleEcr/:classRecordId', isAuthenticatedUser, authorizeRoles("registrar", "teacher", "admin", "super admin"), getSingleEcr);
router.get('/singleScores/:classRecordId/:lrn', isAuthenticatedUser, authorizeRoles("registrar", "teacher", "admin", "super admin"), getSingleScores);

router.put('/update/singleEcr/:classRecordId', isAuthenticatedUser, authorizeRoles("registrar", "teacher", "admin", "super admin"), updateClassRecord);

router.put('/update/firstQuarter/:classRecordId', isAuthenticatedUser, authorizeRoles("registrar", "teacher", "admin", "super admin"), updateFirstQuarter);
router.put('/update/secondQuarter/:classRecordId', isAuthenticatedUser, authorizeRoles("registrar", "teacher", "admin", "super admin"), updateSecondQuarter);
router.put('/update/firstQuarter/possibleScores/:classRecordId', isAuthenticatedUser, authorizeRoles("registrar", "teacher", "admin", "super admin"), updatePossibleScoresFQ);
router.put('/update/secondQuarter/possibleScores/:classRecordId', isAuthenticatedUser, authorizeRoles("registrar", "teacher", "admin", "super admin"), updatePossibleScoresSQ);

router.get('/classCard/:sectionId/:lrn', isAuthenticatedUser, authorizeRoles("registrar", "teacher", "admin", "super admin"), getClassCard);
router.post("/arrange-subjects", isAuthenticatedUser, authorizeRoles("registrar", "admin", "super admin"), arrangeSubjects);
router.get('/my/subjects/:sectionId', isAuthenticatedUser, authorizeRoles("registrar", "teacher", "super admin"), ecrSectionList);

router.get('/section/list/:sectionId', isAuthenticatedUser, authorizeRoles("admin", "super admin"), adminSectionList);
router.get('/allSection/classRecords', isAuthenticatedUser, authorizeRoles("admin", "super admin"), adminAllSectionClassRecords);
router.get('/classRecords/:sectionId/inactive', isAuthenticatedUser, authorizeRoles("admin", "super admin"), listInactiveClassRecords);

router.put('/classRecords/:classRecordId/deactivate', isAuthenticatedUser, authorizeRoles("registrar", "admin", "super admin"), softDeleteClassRecord);
router.put('/classRecords/:classRecordId/reactivate', isAuthenticatedUser, authorizeRoles("registrar", "admin", "super admin"), restoreClassRecord);

module.exports = router;
