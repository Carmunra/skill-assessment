const asyncHandler = require('express-async-handler');
const {
  getAllStudents,
  getStudentDetail,
  addNewStudent,
  updateStudent,
  setStudentStatus,
  deleteStudent,
} = require('./students-service');

const handleGetAllStudents = asyncHandler(async (req, res) => {
  const { class: className, name, section, roll } = req.query;
  const students = await getAllStudents({ name, className, section, roll });
  res.status(200).json({ students });
});

const handleGetStudentDetail = asyncHandler(async (req, res) => {
  const student = await getStudentDetail(Number(req.params.id));
  res.status(200).json(student);
});

const handleAddStudent = asyncHandler(async (req, res) => {
  const result = await addNewStudent(req.body);
  res.status(201).json(result);
});

const handleUpdateStudent = asyncHandler(async (req, res) => {
  const result = await updateStudent({
    ...req.body,
    userId: Number(req.params.id),
  });
  res.status(200).json(result);
});

const handleStudentStatus = asyncHandler(async (req, res) => {
  const result = await setStudentStatus({
    userId: Number(req.params.id),
    reviewerId: req.user.id,
    status: req.body.status,
  });
  res.status(200).json(result);
});

const handleDeleteStudent = asyncHandler(async (req, res) => {
  const result = await deleteStudent(Number(req.params.id));
  res.status(200).json(result);
});

module.exports = {
  handleGetAllStudents,
  handleGetStudentDetail,
  handleAddStudent,
  handleUpdateStudent,
  handleStudentStatus,
  handleDeleteStudent,
};
