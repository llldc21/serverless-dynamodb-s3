const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs");
const { Table, Entity } = require("dynamodb-toolbox");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const { v4: uuidv4 } = require("uuid");
AWS.config.update({
  region: "us-west-2", //change to process.env
  endpoint: "http://localhost:8000", //change to process.env
});

const DocumentClient = new DynamoDB.DocumentClient();

const table = "users-table";

const createDbUser = async (props) => {
  const passwordHash = await bcrypt.hash(props.password, 8);
  delete props.password;

  const response = await DocumentClient.put({
    TableName: table,
    Item: {
      id: uuidv4(),
      email: props.email,
      type: "User",
      passwordHash: passwordHash,
      createdAt: new Date(),
    },
    ReturnValues: "ALL_OLD",
  }).promise();

  return response;
};

const getUserByEmail = async (email) => {
  const data = await DocumentClient.get({
    TableName: table,
    Key: {
      email: email,
      type: "User",
    },
  }).promise();

  return data.Item;
};

module.exports = {
  createDbUser,
  getUserByEmail,
};
