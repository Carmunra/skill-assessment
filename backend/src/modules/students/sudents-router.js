const express = require('express');
const { validateRequest } = require('../../utils');
const { isUserAdmin, checkApiAccess } = require('../../middlewares');
const controller = require('./students-controller');
const {
  listStudentsSchema,
  studentIdSchema,
  addStudentSchema,
  updateStudentSchema,
  updateStatusSchema,
} = require('./students-schema');

const router = express.Router();

router.get('', validateRequest(listStudentsSchema), checkApiAccess, controller.handleGetAllStudents);
router.post('', validateRequest(addStudentSchema), checkApiAccess, controller.handleAddStudent);
router.get('/:id', validateRequest(studentIdSchema), checkApiAccess, controller.handleGetStudentDetail);
router.put('/:id', validateRequest(updateStudentSchema), checkApiAccess, controller.handleUpdateStudent);
router.post('/:id/status', validateRequest(updateStatusSchema), checkApiAccess, controller.handleStudentStatus);
router.delete('/:id', isUserAdmin, validateRequest(studentIdSchema), controller.handleDeleteStudent);

module.exports = { studentsRoutes: router };
