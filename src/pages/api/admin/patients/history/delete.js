import axios from 'axios';
import { getToken } from 'next-auth/jwt';
import { sanitizeOBJ } from '@/utils/utils';

async function deleteRecord(id) {
  const url = `${process.env.VIDASHY_URL}${process.env.VIDASHY_ORGANIZATION}/${process.env.VIDASHY_DATABASE}/histories`;
  try {
    const delete_record = sanitizeOBJ({
      id,
      status: 'inactive',
    });

    const response = await axios({
      method: 'patch',
      url,
      headers: {
        Authorization: `Bearer ${process.env.VIDASHY_API_KEY}`,
      },
      data: delete_record,
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

    const { id } = req.query;

    const response = await deleteRecord(id);

    if (!response)
      return res.status(500).send({ message: 'Record could not be deleted ' });

    res.status(200).json({ response });
  } catch (error) {
    console.error('Error getting token or session:', error);
  }
}
