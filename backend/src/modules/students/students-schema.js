const { z } = require('zod');

const studentIdParams = z.object({
  id: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

const dateValue = z.string().refine(
  (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isNaN(Date.parse(value)),
  'Invalid date'
);

const studentFields = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(100),
  gender: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  dob: dateValue.optional(),
  class: z.string().trim().optional(),
  section: z.string().trim().optional(),
  roll: z.union([z.string().regex(/^\d+$/), z.number().int().nonnegative()]).optional(),
  admissionDate: dateValue.optional(),
  fatherName: z.string().trim().optional(),
  fatherPhone: z.string().trim().optional(),
  motherName: z.string().trim().optional(),
  motherPhone: z.string().trim().optional(),
  guardianName: z.string().trim().optional(),
  guardianPhone: z.string().trim().optional(),
  relationOfGuardian: z.string().trim().optional(),
  currentAddress: z.string().trim().optional(),
  permanentAddress: z.string().trim().optional(),
  systemAccess: z.boolean().optional(),
}).strict();

const listStudentsSchema = z.object({
  query: z.object({
    name: z.string().optional(),
    class: z.string().optional(),
    section: z.string().optional(),
    roll: z.string().regex(/^\d+$/).optional(),
  }).strict(),
});

const studentIdSchema = z.object({ params: studentIdParams });
const addStudentSchema = z.object({ body: studentFields });
const updateStudentSchema = z.object({
  params: studentIdParams,
  body: studentFields.partial().refine(
    (body) => Object.keys(body).length > 0,
    'At least one field must be provided'
  ),
});
const updateStatusSchema = z.object({
  params: studentIdParams,
  body: z.object({ status: z.boolean() }).strict(),
});

module.exports = {
  listStudentsSchema,
  studentIdSchema,
  addStudentSchema,
  updateStudentSchema,
  updateStatusSchema,
};
