const express = require('express');
const { authMiddleware } = require('../middleware/AuthMiddleware');
const { adminMiddleware } = require('../middleware/AdminMiddleware');

function createSupporterRoutes(controller) {
  const router = express.Router();

  router.get('/', controller.list);
  router.post('/', controller.create);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}

function createAuthenticatedSupporterRoutes(authService, controller) {
  const router = express.Router();
  router.use(authMiddleware(authService), adminMiddleware());
  router.use('/', createSupporterRoutes(controller));
  return router;
}

function createPublicSupporterRoutes(controller) {
  const router = express.Router();
  router.get('/', controller.listPublic);
  return router;
}

module.exports = {
  createSupporterRoutes,
  createAuthenticatedSupporterRoutes,
  createPublicSupporterRoutes,
};
