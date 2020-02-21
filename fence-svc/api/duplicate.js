module.exports.create = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const title = requestBody.title;
  const desc = requestBody.description;
  const categoryId = requestBody.category;

  if (
    typeof title !== 'string' ||
    typeof desc !== 'string' ||
    typeof categoryId !== 'number'
  ) {
    console.error('Validation Failed');
    callback(new Error('Validation Errors.'));
    return;
  }

  submitProductForm(productInfo(title, desc, categoryId))
    .then(res => {
      callback(null, {
        statusCode: 201,
        body: JSON.stringify({
          message: `Sucessfully created Product ${title}`,
          productId: res.id
        })
      });
    })
    .catch(err => {
      console.log(err);
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unable to create Product ${title}`
        })
      });
    });
};

const submitProductForm = product => {
  console.log('Submitting new product ...');
  const productInfo = {
    TableName: process.env.FARM_PROJ_PRODUCT_TABLE,
    Item: product
  };
  return dynamoDb
    .put(productInfo)
    .promise()
    .then(res => product);
};

const productInfo = (title, desc, categoryId) => {
  const timestamp = new Date().getTime();
  return {
    id: uuid(),
    title: title,
    description: desc,
    categoryId: categoryId,
    createdAt: timestamp,
    updatedAt: timestamp
  };
};

module.exports.list = (event, context, callback) => {
  var params = {
    TableName: process.env.FARM_PROJ_PRODUCT_TABLE,
    ProjectionExpression: 'id, title, decription'
  };

  console.log('Scanning Product table.');
  const onScan = (err, data) => {
    if (err) {
      console.log(
        'Scan failed to load data. Error JSON:',
        JSON.stringify(err, null, 2)
      );
      callback(err);
    } else {
      console.log('Scan succeeded.');
      return callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          products: data.Items
        })
      });
    }
  };

  dynamoDb.scan(params, onScan);
};

module.exports.get = (event, context, callback) => {
  const params = {
    TableName: process.env.FARM_PROJ_PRODUCT_TABLE,
    Key: {
      id: event.pathParameters.id
    }
  };

  dynamoDb
    .get(params)
    .promise()
    .then(result => {
      const response = {
        statusCode: 200,
        body: JSON.stringify(result.Item)
      };
      callback(null, response);
    })
    .catch(error => {
      console.error(error);
      callback(new Error("Couldn't fetch this product."));
      return;
    });
};
