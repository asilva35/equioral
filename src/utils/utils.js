import dompurify from 'isomorphic-dompurify';

//create function to sanitize object from xss
function sanitizeOBJ(obj) {
  if (typeof obj === 'object') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          // Clean the string content to prevent XSS
          obj[key] = sanitize(obj[key]);
        } else if (typeof obj[key] === 'object') {
          // Recursively clean nested objects
          obj[key] = sanitizeOBJ(obj[key]);
        }
        // Add more conditions as needed for other data types
      }
    }
  }
  return obj;
}

//create function to sanitize the input with dompurify
function sanitize(input) {
  return dompurify.sanitize(input);
}

//FUNCTION CONVERT FORMAT DATE FROM ISO 8601 (2023-12-27T16:46:42.208Z) TO DD/MM/YYYY OR YYYY-MM-DD
function formatDate(date, format = 'DD/MM/YYYY') {
  if (!date) return;
  const dateSplit = date.split('T');
  const dateSplit2 = dateSplit[0].split('-');
  if (format == 'DD/MM/YYYY')
    return `${dateSplit2[2]}/${dateSplit2[1]}/${dateSplit2[0]}`;
  else if (format == 'YYYY-MM-DD')
    return `${dateSplit2[0]}-${dateSplit2[1]}-${dateSplit2[2]}`;
}

//FUNCTION CONVERT FORMAT DD/MM/YYYY TO YYYY-MM-DD
function formatDateToISOSM(date) {
  if (!date) return;
  const dateSplit = date.split('/');
  return `${dateSplit[2]}-${dateSplit[1]}-${dateSplit[0]}`;
}

//FUNCTION TO CAPITALIZE FIRST LETTER OF A STRING
function capitalizeFirstLetter(string) {
  if (string == null || string == undefined) return;
  return string.charAt(0).toUpperCase() + string.slice(1);
}

//FUNCTION FOR SHORT UUID
function shortUUID(uuid) {
  if (!uuid) return uuid;
  if (!uuid.length < 10) return uuid;
  return `${uuid.substring(0, 5)}...${uuid.substring(uuid.length - 5)}`;
}

export {
  formatDate,
  formatDateToISOSM,
  capitalizeFirstLetter,
  shortUUID,
  sanitizeOBJ,
  sanitize,
};
