const express = require('express');

const assetController = require('../controllers/assetController');

const router = express.Router();

router
    .route('/')
    // .get(assetController.getAssets)
    .post(assetController.createAsset);

router
    .route('/:id')
    .post(assetController.transferAsset)

router
    .route('/optin/:id')
    // .get(assetController.getOptins)
    .post(assetController.optinAsset)
// .delete(assetController.removeOptin);

module.exports = router;