const express = require('express');
const { authMiddleware } = require('../middleware/AuthMiddleware');
const { adminMiddleware } = require('../middleware/AdminMiddleware');

function createCarouselSlideRoutes(controller) {
  const router = express.Router();

  router.get('/settings', controller.getSettings);
  router.put('/settings', controller.updateSettings);
  router.get('/themes', controller.listThemes);
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.post('/import-defaults', controller.importDefaults);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}

function createAuthenticatedCarouselSlideRoutes(authService, controller) {
  const router = express.Router();
  router.use(authMiddleware(authService), adminMiddleware());
  router.use('/', createCarouselSlideRoutes(controller));
  return router;
}

function createPublicCarouselSlideRoutes(controller) {
  const router = express.Router();
  router.get('/settings', controller.getPublicSettings);
  router.get('/themes', controller.listThemes);
  router.get('/', controller.listPublic);
  return router;
}

module.exports = {
  createCarouselSlideRoutes,
  createAuthenticatedCarouselSlideRoutes,
  createPublicCarouselSlideRoutes,
};
