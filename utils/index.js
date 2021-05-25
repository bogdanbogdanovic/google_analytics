/* eslint-disable prefer-destructuring */
const db = require('mongoose').connection;
const _ = require('lodash');
const { ValidationError } = require('mongoose').Error;
const fs = require('fs');
const base64ToImage = require('base64-to-image');


function checkObject(data) {
  return (typeof data === 'object') && !Array.isArray(data) && (data !== null);
}

function handleError(res, statusCode = 500) {
  return (err) => {
    if (err) {
      if (err.statusCode) {
        statusCode = err.statusCode;
      } else if (err instanceof ValidationError) {
        statusCode = 422;
      }

      console.error(err);
      res.status(statusCode);
      res.send(err);
    }
  };
}

function respondWith(res, statusCode = 200) {
  return () => {
    res.status(statusCode)
      .end();
  };
}

function responseWithResult(res, statusCode = 200) {
  return (entity) => {
    if (entity) {
      res.status(statusCode)
        .json(entity);
    }
  };
}

function handleEntityNotFound(res) {
  return (entity) => {
    if (!entity) {
      res.status(404)
        .end();
      return Promise.reject(entity);
    }
    return entity;
  };
}

const handleException = (state) => (error) => {
  console.log(`app crashed by any reason at ${state}`, error.message || error.error || error)
}

function getDate(startDate) {
  return Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 3600 * 24));
}

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    // eslint-disable-next-line no-await-in-loop
    await callback(array[index], index, array);
  }
};

function getFullDate(date) {
  const dateInstance = new Date(date)
  const fullYear = dateInstance.getFullYear();
  const month = ("0" + (dateInstance.getMonth() + 1)).slice(-2);
  const dateNumber = ("0" + dateInstance.getDate()).slice(-2);

  return `${fullYear}-${month}-${dateNumber}`
}

module.exports = {
  handleError,
  handleException,
  respondWith,
  asyncForEach,
  getFullDate,
  getDate,
  responseWithResult,
  handleEntityNotFound,
};
