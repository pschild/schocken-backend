## Installation

1. install dependencies with `$ npm install`

2. copy `.env.template` to `.env` and fill in the important data.

## API definition

http://localhost:3000/api  
http://localhost:3000/api-json

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# test coverage
$ npm run test:cov
```

## DB Migration

```bash
# generate migration files for existing entities
$ npm run migration:generate

# create empty migration file
$ npm run migration:create

# run migrations
$ npm run migration:run
```
