const express = require('express');

const bookingsController = require('../controllers/bookings');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/new-booking/:url', isAuth, bookingsController.getNewBooking);

router.post('/new-booking/:url', isAuth, bookingsController.postNewBooking);
router.post('/delete-booking', isAuth, bookingsController.postDeleteBooking);

module.exports = router;