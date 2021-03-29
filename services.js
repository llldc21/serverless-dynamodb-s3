const bcrypt = require("bcryptjs");
const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");

const { getUserByEmail } = require("./db");
const s3 = new AWS.S3({
  s3ForcePathStyle: true,
  accessKeyId: "S3RVER", //change to process.env
  secretAccessKey: "S3RVER", //change to process.env
  endpoint: new AWS.Endpoint("http://localhost:4569"), //change to process.env,
});

module.exports.login = async (args) => {
  try {
    const user = await getUserByEmail(args.email);

    const isValidPassword = await this.comparePassword(
      args.password,
      user.passwordHash
    );

    console.log(isValidPassword);

    if (isValidPassword) {
      const token = jwt.sign(user, "bemdificil");
      return Promise.resolve({ auth: true, token: token, status: "SUCCESS" });
    } else {
      return Promise.resolve({
        statusCode: 400,
        message: "Invalid password",
      });
    }
  } catch (err) {
    console.info("Error login", err);
    return Promise.reject(new Error(err));
  }
};

module.exports.comparePassword = async (eventPassword, userPassword) => {
  return bcrypt.compare(eventPassword, userPassword);
};

module.exports.getErrorMessage = async (message) => ({
  statusCode: 500,
  body: JSON.stringify({ message }),
});

module.exports.uploadToS3 = (bucket, key, buffer, mimeType) =>
  new Promise((resolve, reject) => {
    s3.upload(
      { Bucket: bucket, Key: key, Body: buffer, ContentType: mimeType },
      function (err, data) {
        if (err) reject(err);
        resolve(data);
      }
    );
  });

module.exports.generateAuthResponse = (principalId, effect, methodArn) => {
  const policyDocument = this.generatePolicyDocument(effect, methodArn);

  return {
    principalId,
    policyDocument,
  };
};

module.exports.generatePolicyDocument = (effect, methodArn) => {
  if (!effect || !methodArn) return null;

  const policyDocument = {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: effect,
        Resource: methodArn,
      },
    ],
  };

  return policyDocument;
};
