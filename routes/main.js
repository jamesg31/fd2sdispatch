const express = require('express');

const mainController = require('../controllers/main');
const isAuth = require('../middleware/is-auth');
const isntAuth = require('../middleware/isnt-auth');

const router = express.Router();

router.get('/', mainController.getIndex);

router.get('/login', isntAuth, mainController.getLogin);
router.get('/logout', isAuth, mainController.getLogout);

module.exports = router;