const getRandomInt = (initMin, initMax) => {
  const min = Math.ceil(initMin);
  const max = Math.floor(initMax);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomFromArray = (array) => {
  const i = getRandomInt(0, array.length);
  return array[i];
};

const getRandomKeyFromObject = (object) => {
  const keys = Object.keys(object);
  const i = getRandomInt(0, keys.length - 1);
  return keys[i];
};

const getRandomPropFromObject = (object) => {
  const keys = Object.keys(object);
  const i = getRandomInt(0, keys.length - 1);
  return object[keys[i]];
};

module.exports = {
  getRandomInt,
  getRandomFromArray,
  getRandomKeyFromObject,
  getRandomPropFromObject,
};
