import { getRecords } from '@/vidashy-sdk/dist/backend';
import { filterBy, filterValue } from '@/utils/filters';

async function getRecord(id) {
  return await getRecords({
    backend_url: process.env.VIDASHY_URL,
    organization: process.env.VIDASHY_ORGANIZATION,
    database: process.env.VIDASHY_DATABASE,
    object: 'patients',
    api_key: process.env.VIDASHY_API_KEY,
    params: {
      filterBy: filterBy({ id }),
      filterValue: filterValue({ id }),
    },
  });
}

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    let records = await getRecord(id);

    if (!records || !records.records || records.records.length === 0)
      return res
        .status(404)
        .send({ data: records, message: 'Records Not found' });

    //REMOVE SENSIBLE DATA OF RECORDS
    records.records.map((_record) => {
      delete _record._id;
      delete _record.updatedAt;
    });

    res.status(200).json({ data: records });
  } catch (error) {
    console.error('Error getting token or session:', error);
  }
}
