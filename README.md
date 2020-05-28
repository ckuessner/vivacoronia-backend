# Backend

## Production setup
To start the application in production mode run:

```bash
npm run prod
```

## Development setup
To start the application for the first time, just run:

```bash
npm install
docker-compose build
```

Afterwards you can start the server with:

```bash
docker-compose up
```

The server should restart automatically, when a `.ts`, `.json` and `.yaml`
files change.

The application should be running on port `3000` over plain HTTP.

The OpenAPI Specification is in `api.yaml`. Swagger-ui is set up at http://localhost:3000/swagger.

There is a MongoDB Web (mongo-express) interface listening on port `8081`.
