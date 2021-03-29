const Busboy = require("busboy");
const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");
const { v4: uuid } = require("uuid");

const { createDbUser } = require("./db");
const {
  generateAuthResponse,
  login,
  uploadToS3,
  getErrorMessage,
} = require("./services");

const bucket = "local-bucket"; //change to process.env
const MAX_SIZE = 4000000;

const s3 = new AWS.S3({
  s3ForcePathStyle: true,
  accessKeyId: "S3RVER", //change to process.env
  secretAccessKey: "S3RVER", //change to process.env
  endpoint: new AWS.Endpoint("http://localhost:4569"), //change to process.env
});

module.exports.parser = (event, fileZise) =>
  new Promise((resolve, reject) => {
    const busboy = new Busboy({
      headers: {
        "content-type":
          event.headers["content-type"] || event.headers["Content-Type"],
      },
      limits: {
        fileZise,
      },
    });

    const result = {
      files: [],
    };

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      const uploadFile = {};
      file.on("data", (data) => {
        uploadFile.content = data;
      });
      file.on("end", () => {
        if (uploadFile.content) {
          uploadFile.filename = filename;
          uploadFile.contentType = mimetype;
          uploadFile.encoding = encoding;
          uploadFile.fieldname = fieldname;
          result.files.push(uploadFile);
        }
      });
    });

    busboy.on("field", (fieldname, value) => {
      result[fieldname] = value;
    });

    busboy.on("error", (error) => {
      reject(error);
    });

    busboy.on("finish", () => {
      resolve(result);
    });

    busboy.write(event.body, event.isBase64Encoded ? "base64" : "binary");
    busboy.end();
  });

module.exports.handler = async (event) => {
  try {
    const formData = await this.parser(event, MAX_SIZE);
    const file = formData.files[0];

    const uid = uuid();
    const originalKey = `${uid}_original_${file.filename}`;

    const [originalFile] = await Promise.all([
      uploadToS3(bucket, originalKey, file.content, file.contentType),
    ]);

    const signedOriginalUrl = s3.getSignedUrl("getObject", {
      Bucket: "local-bucket",
      Key: originalKey,
      Expires: 60000,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: uid,
        mimeType: file.contentType,
        originalKey: originalFile.key,
        bucket,
        fileName: file.filename,
        originalUrl: signedOriginalUrl,
        originalSize: file.content.byteLength,
      }),
    };
  } catch (e) {
    console.log(e);
    return getErrorMessage(e.message);
  }
};

module.exports.register = async function registerUser(event) {
  const body = JSON.parse(event.body);

  return createDbUser(body)
    .then((user) => ({
      statusCode: 200,
      body: JSON.stringify(user),
    }))
    .catch((err) => {
      console.log({ err });

      return {
        statusCode: err.statusCode || 500,
        headers: { "Content-Type": "text/plain" },
        body: { stack: err.stack, message: err.message },
      };
    });
};

module.exports.get = async function signInUser(event) {
  const body = JSON.parse(event.body);

  return login(body)
    .then((session) => ({
      statusCode: session.statusCode || 200,
      body: JSON.stringify(session),
    }))
    .catch((err) => {
      console.log({ err });

      return {
        statusCode: err.statusCode || 500,
        headers: { "Content-Type": "text/plain" },
        body: { stack: err.stack, message: err.message },
      };
    });
};

module.exports.verifyToken = (event, context, callback) => {
  const token = event.authorizationToken.replace("Bearer ", "");
  console.log("TOKEN", token);
  const methodArn = event.methodArn;

  if (!token || !methodArn) return callback(null, "Unauthorized");

  const secret = "bemdificil";

  // verifies token
  const decoded = jwt.verify(token, secret);

  console.log("DECODED", decoded);

  if (decoded && decoded.id) {
    return callback(null, generateAuthResponse(decoded.id, "Allow", methodArn));
  } else {
    return callback(null, generateAuthResponse(decoded.id, "Deny", methodArn));
  }
};
