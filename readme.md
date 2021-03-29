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
