const sortBy = (object) => {
  const sort = [];
  Object.keys(object).forEach((key) => {
    if (object[key]) sort.push(key);
  });

  return sort.join(',');
};
const sortValue = (object) => {
  const sort = [];
  Object.keys(object).forEach((key) => {
    if (object[key]) sort.push(object[key]);
  });
  return sort.join(',');
};

export { sortBy, sortValue };
