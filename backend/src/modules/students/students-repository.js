const { db } = require('../../config');
const { processDBRequest } = require('../../utils');

const findAllStudents = async ({ name, className, section, roll }) => {
  const clauses = ['u.role_id = 3'];
  const values = [];

  for (const [column, value] of [
    ['u.name', name],
    ['p.class_name', className],
    ['p.section_name', section],
    ['p.roll', roll],
  ]) {
    if (value !== undefined && value !== '') {
      values.push(value);
      clauses.push(`${column} = $${values.length}`);
    }
  }

  const query = `
    SELECT u.id, u.name, u.email,
           u.last_login AS "lastLogin",
           u.is_active AS "systemAccess"
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE ${clauses.join(' AND ')}
     ORDER BY u.id
  `;
  const { rows } = await processDBRequest({ query, queryParams: values });
  return rows;
};

const findStudentDetail = async (id) => {
  const query = `
    SELECT u.id, u.name, u.email, u.is_active AS "systemAccess",
           p.phone, p.gender, p.dob,
           p.class_name AS "class", p.section_name AS "section",
           p.roll, p.father_name AS "fatherName",
           p.father_phone AS "fatherPhone",
           p.mother_name AS "motherName",
           p.mother_phone AS "motherPhone",
           p.guardian_name AS "guardianName",
           p.guardian_phone AS "guardianPhone",
           p.relation_of_guardian AS "relationOfGuardian",
           p.current_address AS "currentAddress",
           p.permanent_address AS "permanentAddress",
           p.admission_dt AS "admissionDate",
           r.name AS "reporterName"
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      LEFT JOIN users r ON r.id = u.reporter_id
     WHERE u.id = $1 AND u.role_id = 3
  `;
  const { rows } = await processDBRequest({ query, queryParams: [id] });
  return rows[0];
};

const toDatabaseDate = (value) => {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return typeof value === 'string' ? value.slice(0, 10) : value;
};

const addOrUpdateStudent = async (payload) => {
  const normalized = { ...payload };
  for (const field of ['dob', 'admissionDate']) {
    if (normalized[field] != null) {
      normalized[field] = toDatabaseDate(normalized[field]);
    }
  }
  const { rows } = await processDBRequest({
    query: 'SELECT * FROM student_add_update($1::jsonb)',
    queryParams: [JSON.stringify(normalized)],
  });
  return rows[0];
};

const findStudentToSetStatus = async ({ userId, reviewerId, status }) => {
  const { rowCount } = await processDBRequest({
    query: `
      UPDATE users
         SET is_active = $1,
             status_last_reviewed_dt = NOW(),
             status_last_reviewer_id = $2
       WHERE id = $3 AND role_id = 3
    `,
    queryParams: [status, reviewerId, userId],
  });
  return rowCount;
};

const deleteStudentById = async (id) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT id FROM users WHERE id = $1 AND role_id = 3 FOR UPDATE',
      [id]
    );
    if (!rows.length) {
      await client.query('ROLLBACK');
      return false;
    }

    await client.query('DELETE FROM user_profiles WHERE user_id = $1', [id]);
    await client.query('DELETE FROM users WHERE id = $1 AND role_id = 3', [id]);
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  findAllStudents,
  findStudentDetail,
  addOrUpdateStudent,
  findStudentToSetStatus,
  deleteStudentById,
};
