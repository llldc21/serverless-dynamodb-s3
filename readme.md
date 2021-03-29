# Tweak Test

Create an API to enable system users to securely upload images provided that they are authenticated.

## Info

The api is created using `serverless offiline`, all configuration is carried out by serverless.yml.
When serverless is started it configures S3 and also DynamoDB. It also configures the entire document in the DynamoDB "table".

To run you need.

1. Install package dependencies.

```
npm install / yarn install
```

2. Run serverless offiline

```
npm start / yarn start
```

## Routes

When you run serverless offline by default it uses port 3000, but changing serverless.yml, in `custom -> serverless-offline -> httpPort`, it is possible to define which port you want it to run on.

The `BASE_URL` can be found after serverless start, when you run the command to start, it prints some information on the screen, such as the routes of the application, the services started and where the server is running.

Your terminal should appear something like this:

```
Serverless: starting handler
warn: the bucket "local-bucket" already exists
Serverless: S3 local started ( port:4569, family: IPv4, address: 127.0.0.1 )
Dynamodb Local Started, Visit: http://localhost:8000/shell
Serverless: DynamoDB - created table users-table
offline: Starting Offline: dev/us-east-1.
offline: Offline [http for lambda] listening on http://localhost:3002
offline: Function names exposed for local invocation by aws-sdk:
           * verify-token: tweak-test-dev-verify-token
           * UploadFileHome: tweak-test-dev-UploadFileHome
           * login: tweak-test-dev-login
           * register: tweak-test-dev-register
offline: Configuring Authorization: upload verify-token

POST http://localhost:3000/dev/upload
POST http://localhost:3000/2015-03-31/functions/UploadFileHome/invocations
POST http://localhost:3000/dev/login
POST http://localhost:3000/2015-03-31/functions/login/invocations
POST http://localhost:3000/dev/register
POST http://localhost:3000/2015-03-31/functions/register/invocations

offline: [HTTP] server ready: http://localhost:3000 🚀
offline:
offline: Enter "rp" to replay the last request
```

The base url ir found in
`offline: [HTTP] server ready: http://localhost:3000 🚀`

### Authentication

- `/dev/register` - Used by create an user, expect:

```
curl --request POST \
  --url <BASE_URL>/dev/register \
  --header 'Content-Type: application/json' \
  --data '{
	  "email": <EMAIL>,
	  "password": <PASSWORD>
  }'
```

The sucess return is:

```
{}
```

And the request staus is `200`.
When request return an error this is the response:

```
{
  "errorMessage": string,
  "errorType": string,
  "offlineInfo": string,
  "stackTrace": string
}
```

- `/dev/login` - Used by generate a JWT token to user, expect:

```
curl --request POST \
  --url <BASE_URL>/dev/login \
  --header 'Content-Type: application/json' \
  --data '{
	  "email": <EMAIL>,
	  "password": <PASSWORD>
  }'
```

The success return status 200 and:

```
{
  "auth": boolean,
  "token": string,
  "status": string
}
```

If a password is invalid:

```
{
  "statusCode": number,
  "message": string
}
```

If error is unknown

```
{
  "errorMessage": string,
  "errorType": string,
  "offlineInfo": string,
  "stackTrace": string | null
}
```

### Image upload

- `/dev/upload` - Used to upload the image to S3, it's a multipart form, expect:

```
curl --request POST \
  --url <BASE_URL>/dev/upload \
  --header 'Authorization: Bearer <AUTH_TOKEN>' \
  --header 'Content-Type: multipart/form-data; \
  --form 'file=<FILE_PATH>'
```

The `AUTH_TOKEN` is found in response of the request in `/dev/login`, is the parameter `token`

The succes response return status 200 and:

```
{
  "id": string,
  "mimeType": string,
  "originalKey": string,
  "bucket": string,
  "fileName": string,
  "originalUrl": string,
  "originalSize": number
}
```

If an error is found, return status 500 and:

```
{
  "message": string
}
```
