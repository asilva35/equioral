import axios from 'axios';
import { getRecords } from '@/vidashy-sdk/dist/backend';
import { getToken } from 'next-auth/jwt';
import { sanitizeOBJ } from '@/utils/utils';
import { sortBy, sortValue } from '@/utils/sorts';

function generateUUID() {
  let d = new Date().getTime();
  const uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    // eslint-disable-next-line no-bitwise
    const r = (d + Math.random() * 16) % 16 | 0;
    // eslint-disable-next-line no-bitwise
    d = Math.floor(d / 16);
    // eslint-disable-next-line no-bitwise
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uuid;
}

async function listRecords() {
  return await getRecords({
    backend_url: process.env.VIDASHY_URL,
    organization: process.env.VIDASHY_ORGANIZATION,
    database: process.env.VIDASHY_DATABASE,
    object: 'histories',
    api_key: process.env.VIDASHY_API_KEY,
    params: {
      sortBy: sortBy({ createdAt: -1 }),
      sortValue: sortValue({ createdAt: -1 }),
    },
  });
}

async function createRecord(record) {
  let new_id = 1;
  let recordsDB = await listRecords();

  if (!recordsDB) return null; //IMPORTANT: IF DB NOT RESPOND RETURN NULL

  //IF RECORDS EXIST, GET THE LAST ID AND ADD 1
  //IF NOT MEANS COLLECTION IS EMPTY, THEN NEW ID IS 1
  if (recordsDB.records && recordsDB.records.length > 0) {
    new_id = Number.parseInt(recordsDB.records[0].id) + 1;
  }

  if (typeof new_id !== 'number') return null;

  const url = `${process.env.VIDASHY_URL}${process.env.VIDASHY_ORGANIZATION}/${process.env.VIDASHY_DATABASE}/histories`;
  try {
    const new_record = sanitizeOBJ({
      id: new_id.toString(),
      patient_id: record.patient_id,
      first_observation: record.first_observation,
    });

    if (record.treatment) new_record.treatment = record.treatment;
    if (record.photos) new_record.photos = record.photos;

    const response = await axios({
      method: 'post',
      url,
      headers: {
        Authorization: `Bearer ${process.env.VIDASHY_API_KEY}`,
      },
      data: new_record,
    });
    return response.data || null;
  } catch (error) {
    console.error(error.response.data);
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

    const { record_request } = req.body;

    const validation = {};

    if (!record_request.patient_id || record_request.patient_id === '') {
      validation.patient_id = 'Field Required';
    }
    if (
      !record_request.first_observation ||
      record_request.first_observation === ''
    ) {
      validation.first_observation = 'Field Required';
    }

    //EVALUATE IF VALIDATION IS NOT EMPTY
    if (Object.keys(validation).length > 0) {
      return res.status(500).send({
        message: 'Record could not be processed',
        validation,
      });
    }

    const response = await createRecord(record_request);

    if (!response)
      return res
        .status(500)
        .send({ message: 'Record could not be processed ' });

    res.status(200).json({ response });
  } catch (error) {
    console.error('Error getting token or session:', error);
  }
}
