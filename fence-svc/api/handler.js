'use strict';

module.exports.apiTest = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless v1.0 successfully!'
      },
      null,
      2
    )
  };

  callback(null, response);
};
