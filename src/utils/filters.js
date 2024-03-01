const filterBy = (object) => {
  const filter = [];
  Object.keys(object).forEach((key) => {
    if (object[key])
      if (key === 'status' && object[key] != 'all') filter.push(key);
      else if (key !== 'status') filter.push(key);
  });

  return filter.join(',');
};
const filterValue = (object) => {
  const filter = [];
  Object.keys(object).forEach((key) => {
    if (object[key])
      if (key === 'status' && object[key] != 'all') filter.push(object[key]);
      else if (key !== 'status') filter.push(object[key]);
  });
  return filter.join(',');
};

const filterComparison = (object) => {
  const filter = [];
  Object.keys(object).forEach((key) => {
    if (object[key]) filter.push(object[key]);
  });
  return filter.join(',');
};

export { filterBy, filterValue, filterComparison };
