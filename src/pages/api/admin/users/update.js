import axios from 'axios';
import bcryptjs from 'bcryptjs';
import { getToken } from 'next-auth/jwt';
import { sanitizeOBJ } from '@/utils/utils';

async function updateRecord(userid, record) {
  const url = `${process.env.VIDASHY_URL}${process.env.VIDASHY_ORGANIZATION}/${process.env.VIDASHY_DATABASE}/users`;

  try {
    const record_update = sanitizeOBJ({
      id: record.id,
      name: record.name,
      username: record.username,
      email: record.email,
      role: record.role,
      address: record.address,
      invoice_to: record.invoice_to,
      contact_name: record.contact_name,
      contact_phone: record.contact_phone,
    });

    if (record.password) {
      const salt = `$2a$10$${process.env.BCRIPT_SALT}`;
      const hash = bcryptjs.hashSync(record.password, salt);
      record_update.password = hash;
    }

    const response = await axios({
      method: 'patch',
      url: url,
      headers: {
        Authorization: `Bearer ${process.env.VIDASHY_API_KEY}`,
      },
      data: record_update,
    });

    return response.data || null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) return res.status(401).send({ message: 'Not authorized' });

    const { id: userid, role } = token;

    if (role !== 'admin') {
      return res.status(401).send({ message: 'Not authorized' });
    }

    const { record } = req.body;

    const validation = {};

    if (!record.name || record.name === '') {
      validation.name = 'Field Required';
    }
    if (!record.username || record.username === '') {
      validation.username = 'Field Required';
    }
    if (!record.email || record.email === '') {
      validation.email = 'Field Required';
    }
    if (!record.role || record.role === '') {
      validation.role = 'Field Required';
    }

    //EVALUATE IF VALIDATION IS NOT EMPTY
    if (Object.keys(validation).length > 0) {
      return res.status(500).send({
        message: 'Record could not be processed',
        validation,
      });
    }

    const response = await updateRecord(userid, record);

    if (!response)
      return res
        .status(500)
        .send({ message: 'Record could not be processed ' });

    res.status(200).json({ response });
  } catch (error) {
    console.error('Error getting token or session:', error);
  }
}
