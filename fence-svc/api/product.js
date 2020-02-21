'use strict';

const uuid = require('uuid/v4');
const AWS = require('aws-sdk');

AWS.config.setPromisesDependency(require('bluebird'));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const productsTable = process.env.FARM_PROJ_PRODUCT_TABLE;

// Create a response
function response(statusCode, message) {
  return {
    statusCode: statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify(message)
  };
}

function sortByDate(a, b) {
  if (a.createdAt > b.createdAt) {
    return -1;
  } else return 1;
}

// Create a new product
module.exports.create = (event, context, callback) => {
  const reqBody = JSON.parse(event.body);
  const title = reqBody.title;
  const desc = reqBody.description;
  const categoryId = reqBody.category;

  if (
    typeof title !== 'string' ||
    typeof desc !== 'string' ||
    typeof categoryId !== 'number'
  ) {
    console.error('Validation Failed');
    return callback(new Error('Validation Errors.'));
  }

  if (!title || title.trim() === '' || !categoryId) {
    return callback(
      null,
      response(400, {
        error: 'A Product must have a non-empty title and category.'
      })
    );
  }

  const product = {
    id: uuid(),
    title: title,
    description: desc,
    categoryId: categoryId,
    createdAt: new Date().toISOString()
  };

  return dynamoDb
    .put({
      TableName: productsTable,
      Item: product
    })
    .promise()
    .then(() => {
      callback(null, response(201, product));
    })
    .catch(err => response(null, response(err.statusCode, err)));
};

// List all products
module.exports.list = (event, context, callback) => {
  return dynamoDb
    .scan({
      TableName: productsTable
    })
    .promise()
    .then(res => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch(err => callback(null, response(err.statusCode, err)));
};

// Get limited number of products
// module.exports.getNumberOfProducts = (event, context, callback) => {
//   const number = event.pathParameters.number;
//   const params = {
//     TableName: productsTable,
//     Limit: number
//   };
//   return dynamoDb
//     .scan(params)
//     .promise()
//     .then(res => {
//       callback(null, response(200, res.Items.sort(sortByDate)));
//     })
//     .catch(err => callback(null, response(err.statusCode, err)));
// };

// Get a single product
module.exports.getById = (event, context, callback) => {
  const params = {
    TableName: productsTable,
    Key: {
      id: event.pathParameters.id
    }
  };

  return dynamoDb
    .get(params)
    .promise()
    .then(res => {
      if (res.Item) callback(null, response(200, res.Item));
      else callback(null, response(404, { error: 'Product not found.' }));
    })
    .catch(err => callback(null, response(err.statusCode, err)));
};

// Update
module.exports.update = (event, context, callback) => {
  const reqBody = JSON.parse(event.body);
  const { title, description, category } = reqBody;

  const params = {
    Key: {
      id: event.pathParameters.id
    },
    TableName: productsTable,
    ConditionExpression: 'attribute_exists(id)',
    UpdateExpression:
      'SET title = :title, description = :description, categoryId = :categoryId',
    ExpressionAttributeValues: {
      ':title': title,
      ':description': description,
      ':categoryId': category
    },
    ReturnValues: 'ALL_NEW'
  };
  console.log('Updating');

  return dynamoDb
    .update(params)
    .promise()
    .then(res => {
      console.log(res);
      callback(null, response(200, res.Attributes));
    })
    .catch(err => callback(null, response(err.statusCode, err)));
};

// Delete a product
module.exports.delete = (event, context, callback) => {
  const params = {
    Key: {
      id: event.pathParameters.id
    },
    TableName: productsTable
  };
  return dynamoDb
    .delete(params)
    .promise()
    .then(() =>
      callback(
        null,
        response(200, { message: 'Delete selected Product successfully.' })
      )
    )
    .catch(err => callback(null, response(err.statusCode, err)));
};
