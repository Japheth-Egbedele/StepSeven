const express = require('express');
const babyStepRouter = express.Router(); // Match this name
const { checkAuth } = require('../middleware/auth');
const BabyStepController = require('../controllers/babyStepController');

babyStepRouter.use(checkAuth);

babyStepRouter.get('/progress', BabyStepController.getProgress);
babyStepRouter.get('/gazelle-intensity', BabyStepController.getGazelleIntensity);
babyStepRouter.get('/days-ahead', BabyStepController.getDaysAhead);
babyStepRouter.get('/smallest-debt', BabyStepController.getSmallestDebt);
babyStepRouter.get('/emergency-fund', BabyStepController.getEmergencyFund);
babyStepRouter.get('/debt-snowball', BabyStepController.getDebtSnowball);
babyStepRouter.put('/progress', BabyStepController.updateProgress);
babyStepRouter.post('/complete/:stepNumber', BabyStepController.completeStep);
module.exports = babyStepRouter;