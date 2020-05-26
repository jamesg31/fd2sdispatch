const express = require('express');

const flightsController = require('../controllers/flights');
const isAuth = require('../middleware/is-auth');
const isAdmin = require('../middleware/is-admin');

const router = express.Router();

router.get('/flights', isAuth, flightsController.getFlights);
router.get('/flights/:url', isAuth, flightsController.getRoster);
router.get('/new-flight', isAuth, isAdmin, flightsController.getNewFlight);
router.get('/manage-flight/:url', isAuth, isAdmin, flightsController.getManage);

router.post('/new-flight', isAuth, isAdmin, flightsController.postNewFlight);
router.post('/manage-flight', isAuth, isAdmin, flightsController.postManage);
router.post('/delete-flight', isAuth, isAdmin, flightsController.postDelete);
router.post('/open-flight', isAuth, isAdmin, flightsController.postOpen);
router.post('/close-flight', isAuth, isAdmin, flightsController.postClose);

module.exports = router;