const express = require('express');
const router = express.Router();
const multer = require('multer');

// Controllers
const universityController = require('../controller/universityController');
const programController = require('../controller/programController');
const programDetailsController = require('../controller/programDetailsController');
const valueOutcomesController = require('../controller/valueOutcomesController');
const offersController = require('../controller/offersController');
const contractsController = require('../controller/contractsController');
const commercialsController = require('../controller/commercialsController');
const leadsController = require('../controller/leadsController');
const lsqController = require('../controller/lsqController');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ═══════════════════════════════════════════════
// ── Core University (non-parameterized) ──
// ═══════════════════════════════════════════════

router.post('/add', upload.array('docs'), universityController.addUniversity);
router.get('/all', universityController.getUniversities);
router.get('/all-with-progress', universityController.getUniversitiesWithProgress);

// NOTE: /:id routes moved to end of file so they don't catch
// standalone paths like /offer-policies, /payout-rules, etc.

// ═══════════════════════════════════════════════
// ── University Sub-Entities (identity tab) ──
// ═══════════════════════════════════════════════

// Helper to register standard CRUD routes for a sub-entity
const registerSubRoutes = (path, handlers) => {
    router.get(`/:universityId/${path}`, handlers.getAll);
    router.post(`/:universityId/${path}`, handlers.create);
    router.put(`/${path}/:id`, handlers.update);
    router.delete(`/${path}/:id`, handlers.remove);
};

registerSubRoutes('addresses', universityController.addressHandlers);
registerSubRoutes('metadata', universityController.metadataHandlers);
registerSubRoutes('rankings', universityController.rankingHandlers);
registerSubRoutes('accreditations', universityController.accreditationHandlers);
registerSubRoutes('highlights', universityController.highlightHandlers);
registerSubRoutes('gallery', universityController.galleryHandlers);
registerSubRoutes('faqs', universityController.faqHandlers);
registerSubRoutes('faculty', universityController.facultyHandlers);
registerSubRoutes('hiring-partners', universityController.hiringPartnerHandlers);
registerSubRoutes('alumni', universityController.alumniHandlers);
registerSubRoutes('placement-stats', universityController.placementStatsHandlers);
registerSubRoutes('financing-options', universityController.financingHandlers);
registerSubRoutes('support-channels', universityController.supportChannelsHandlers);
registerSubRoutes('scholarships', universityController.scholarshipHandlers);

// ═══════════════════════════════════════════════
// ── Programs (Academic Master) ──
// ═══════════════════════════════════════════════

router.get('/:universityId/programs', programController.getPrograms);
router.post('/:universityId/programs', programController.createProgram);
router.get('/:universityId/programs/:programId', programController.getProgramById);
router.put('/:universityId/programs/:programId', programController.updateProgram);
router.delete('/:universityId/programs/:programId', programController.deleteProgram);

// Program Specializations
router.get('/programs/:programId/specializations', programController.getSpecializations);
router.post('/programs/:programId/specializations', programController.createSpecialization);
router.put('/specializations/:id', programController.updateSpecialization);
router.delete('/specializations/:id', programController.deleteSpecialization);

// Program Offerings
router.get('/programs/:programId/offerings', programController.getOfferings);
router.post('/programs/:programId/offerings', programController.createOffering);
router.put('/offerings/:id', programController.updateOffering);
router.delete('/offerings/:id', programController.deleteOffering);

// ═══════════════════════════════════════════════
// ── Program Details (offering-scoped) ──
// ═══════════════════════════════════════════════

// Fee Structure
router.get('/offerings/:offeringId/fees', programDetailsController.feeHandlers.getAll);
router.post('/offerings/:offeringId/fees', programDetailsController.feeHandlers.create);
router.put('/fees/:id', programDetailsController.feeHandlers.update);
router.delete('/fees/:id', programDetailsController.feeHandlers.remove);

// Program Eligibility
router.get('/offerings/:offeringId/eligibility', programDetailsController.eligibilityHandlers.getAll);
router.post('/offerings/:offeringId/eligibility', programDetailsController.eligibilityHandlers.create);
router.put('/eligibility/:id', programDetailsController.eligibilityHandlers.update);
router.delete('/eligibility/:id', programDetailsController.eligibilityHandlers.remove);

// Program Curriculum
router.get('/offerings/:offeringId/curriculum', programDetailsController.curriculumHandlers.getAll);
router.post('/offerings/:offeringId/curriculum', programDetailsController.curriculumHandlers.create);
router.put('/curriculum/:id', programDetailsController.curriculumHandlers.update);
router.delete('/curriculum/:id', programDetailsController.curriculumHandlers.remove);

// Program Addons
router.get('/offerings/:offeringId/addons', programDetailsController.addonHandlers.getAll);
router.post('/offerings/:offeringId/addons', programDetailsController.addonHandlers.create);
router.put('/addons/:id', programDetailsController.addonHandlers.update);
router.delete('/addons/:id', programDetailsController.addonHandlers.remove);

// Offering Faculty
router.get('/offerings/:offeringId/faculty', programDetailsController.offeringFacultyHandlers.getAll);
router.post('/offerings/:offeringId/faculty', programDetailsController.offeringFacultyHandlers.create);
router.put('/offering-faculty/:id', programDetailsController.offeringFacultyHandlers.update);
router.delete('/offering-faculty/:id', programDetailsController.offeringFacultyHandlers.remove);

// ═══════════════════════════════════════════════
// ── Value & Outcomes ──
// ═══════════════════════════════════════════════

// Placement Outcome Metrics (offering-scoped)
router.get('/offerings/:offeringId/placement-metrics', valueOutcomesController.getPlacementMetrics);
router.post('/offerings/:offeringId/placement-metrics', valueOutcomesController.createPlacementMetric);
router.put('/placement-metrics/:id', valueOutcomesController.updatePlacementMetric);
router.delete('/placement-metrics/:id', valueOutcomesController.deletePlacementMetric);

// Corporate Hiring Partners (standalone)
router.get('/corporate-hiring-partners', valueOutcomesController.getCorporateHiringPartners);
router.post('/corporate-hiring-partners', valueOutcomesController.createCorporateHiringPartner);
router.put('/corporate-hiring-partners/:id', valueOutcomesController.updateCorporateHiringPartner);
router.delete('/corporate-hiring-partners/:id', valueOutcomesController.deleteCorporateHiringPartner);

// Alumni Success Stories (university-scoped)
router.get('/:universityId/alumni-stories', valueOutcomesController.getAlumniStories);
router.post('/alumni-stories', valueOutcomesController.createAlumniStory);
router.put('/alumni-stories/:id', valueOutcomesController.updateAlumniStory);
router.delete('/alumni-stories/:id', valueOutcomesController.deleteAlumniStory);

// ═══════════════════════════════════════════════
// ── Offers & Scholarships ──
// ═══════════════════════════════════════════════

router.get('/offer-policies', offersController.getOfferPolicies);
router.post('/offer-policies', offersController.createOfferPolicy);
router.put('/offer-policies/:id', offersController.updateOfferPolicy);
router.delete('/offer-policies/:id', offersController.deleteOfferPolicy);

router.get('/offer-ledger', offersController.getOfferLedger);
router.post('/offer-ledger', offersController.createOfferLedgerEntry);
router.put('/offer-ledger/:id', offersController.updateOfferLedgerEntry);
router.delete('/offer-ledger/:id', offersController.deleteOfferLedgerEntry);

// ═══════════════════════════════════════════════
// ── Contracts (Legal) ──
// ═══════════════════════════════════════════════

router.get('/:universityId/contracts', contractsController.getContracts);
router.post('/:universityId/contracts', contractsController.createContract);
router.put('/contracts/:id', contractsController.updateContract);
router.delete('/contracts/:id', contractsController.deleteContract);

// Contract Addendums
router.get('/contracts/:contractId/addendums', contractsController.getAddendums);
router.post('/contracts/:contractId/addendums', contractsController.createAddendum);
router.put('/addendums/:id', contractsController.updateAddendum);
router.delete('/addendums/:id', contractsController.deleteAddendum);

// ═══════════════════════════════════════════════
// ── Commercials ──
// ═══════════════════════════════════════════════

router.get('/payout-rules', commercialsController.getPayoutRules);
router.get('/contracts/:contractId/payout-rules', commercialsController.getPayoutRulesByContract);
router.post('/payout-rules', commercialsController.createPayoutRule);
router.put('/payout-rules/:id', commercialsController.updatePayoutRule);
router.delete('/payout-rules/:id', commercialsController.deletePayoutRule);

router.get('/partner-wallets', commercialsController.getPartnerWallets);
router.get('/partner-wallets/:partnerId', commercialsController.getWalletByPartner);
router.post('/partner-wallets', commercialsController.createWallet);
router.put('/partner-wallets/:id', commercialsController.updateWallet);

// ═══════════════════════════════════════════════
// ── Leads ──
// ═══════════════════════════════════════════════

router.get('/:universityId/lead-config', leadsController.getLeadConfig);
router.put('/lead-config/:id', leadsController.updateLeadConfig);

router.get('/:universityId/academic-seasons', leadsController.getAcademicSeasons);
router.post('/:universityId/academic-seasons', leadsController.createAcademicSeason);
router.put('/academic-seasons/:id', leadsController.updateAcademicSeason);
router.delete('/academic-seasons/:id', leadsController.deleteAcademicSeason);

// ═══════════════════════════════════════════════
// ── Live Source Queue (LSQ) ──
// ═══════════════════════════════════════════════

router.get('/lsq/latest', lsqController.getLatest);
router.get('/lsq/all', lsqController.getAll);
router.get('/lsq/offering-latest', lsqController.getOfferingLatest);

// ═══════════════════════════════════════════════
// ── Core University (parameterized — MUST be last) ──
// ═══════════════════════════════════════════════
// These catch-all /:id routes must come after all specific routes
// to avoid matching paths like /offer-policies as a UUID.

router.get('/:id', universityController.getUniversityById);
router.put('/:id', universityController.updateUniversity);

module.exports = router;
