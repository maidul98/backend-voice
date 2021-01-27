const AWS = require("aws-sdk");

module.exports = {
  config: new AWS.Config({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET,
    region: "us-east-2",
  }),
};
