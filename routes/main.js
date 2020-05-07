const express = require('express');

const mainController = require('../controllers/main');
const authController = require('../controllers/auth');

const router = express.Router();

router.get('/', mainController.getIndex);
router.get('/flights', mainController.getFlights);
router.get('/new-flight', mainController.getNewFlight);

router.post('/new-flight', mainController.postNewFlight);

router.get('/login', authController.getLogin);
router.get('/logout', authController.getLogout);

module.exports = router;