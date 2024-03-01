import axios from 'axios';

const getURL = (options) => {
  const { backend_url, organization, database, object, params } = options;
  const {
    filterBy,
    filterValue,
    filterComparison,
    page,
    pageSize,
    sortBy,
    sortValue,
  } = params;
  const filter =
    filterBy && filterValue
      ? `&filterBy=${filterBy}&filterValue=${filterValue}&filterComparison=${filterComparison}`
      : '';

  const sort =
    sortBy && sortValue ? `&sortBy=${sortBy}&sortValue=${sortValue}` : '';

  const pagination = page ? `&page=${page}` : '';
  const numrecords = pageSize ? `&pageSize=${pageSize}` : '';
  return `${backend_url}${organization}/${database}/${object}?v=1.0${filter}${sort}${pagination}${numrecords}`;
};

const getRecords = async (options) => {
  const { api_key } = options;
  const url = getURL(options);
  try {
    const response = await axios({
      method: 'get',
      url: url,
      headers: {
        Authorization: `Bearer ${api_key}`,
      },
    });
    return response.data || null;
  } catch (error) {
    //console.error(error);
    return null;
  }
};

export { getRecords };
