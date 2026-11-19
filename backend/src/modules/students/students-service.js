const { ApiError, sendAccountVerificationEmail } = require('../../utils');
const {
  findAllStudents,
  findStudentDetail,
  findStudentToSetStatus,
  addOrUpdateStudent,
  deleteStudentById,
} = require('./students-repository');
const { findUserById } = require('../../shared/repository');

const ensureStudentExists = async (id) => {
  const user = await findUserById(id);
  if (!user || Number(user.role_id) !== 3) {
    throw new ApiError(404, 'Student not found');
  }
};

const getAllStudents = (filters) => findAllStudents(filters);

const getStudentDetail = async (id) => {
  await ensureStudentExists(id);
  const student = await findStudentDetail(id);
  if (!student) throw new ApiError(404, 'Student not found');
  return student;
};

const addNewStudent = async (payload) => {
  const result = await addOrUpdateStudent(payload);

  if (!result?.status) {
    const conflict = result?.message === 'Email already exists';
    throw new ApiError(conflict ? 409 : 400, result?.message || 'Unable to add student');
  }

  let message = 'Student added successfully';
  try {
    await sendAccountVerificationEmail({
      userId: result.userId,
      userEmail: payload.email,
    });
    message = 'Student added and verification email sent successfully';
  } catch (_) {
    message = 'Student added, but the verification email could not be sent';
  }

  return { id: result.userId, message };
};

const updateStudent = async ({ userId, ...changes }) => {
  // The existing SQL function replaces the entire profile. Merge partial
  // updates with current values to avoid erasing fields not provided.
  const current = await getStudentDetail(userId);
  const result = await addOrUpdateStudent({ ...current, ...changes, userId });

  if (!result?.status) {
    throw new ApiError(400, result?.message || 'Unable to update student');
  }

  return { message: result.message };
};

const setStudentStatus = async ({ userId, reviewerId, status }) => {
  await ensureStudentExists(userId);
  const count = await findStudentToSetStatus({ userId, reviewerId, status });
  if (!count) throw new ApiError(500, 'Unable to update student status');
  return { message: 'Student status changed successfully' };
};

const deleteStudent = async (id) => {
  await ensureStudentExists(id);
  try {
    const deleted = await deleteStudentById(id);
    if (!deleted) throw new ApiError(404, 'Student not found');
  } catch (error) {
    if (error.code === '23503') {
      throw new ApiError(409, 'Student has related records and cannot be deleted');
    }
    throw error;
  }
  return { message: 'Student deleted successfully' };
};

module.exports = {
  getAllStudents,
  getStudentDetail,
  addNewStudent,
  updateStudent,
  setStudentStatus,
  deleteStudent,
};
