## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Prerequisites
- Node.js >= 14.x
- npm >= 6.x
- MongoDB
- Firebase Admin SDK credentials
- Stripe account
- Twilio account (for SMS services)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in all required environment variables

4. Set up Firebase:
   - Place your `serviceAccount.json` in the root directory

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# run project
$ npm run build 
$ npm run dev 

# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod

# run app with all configuration (lint,format,build,dev)
$ npm run app
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Project Overview
BaseFun is a modular and scalable backend service built with NestJS, designed to support user management, session handling, API versioning, and real-time WebSocket communication. The project follows a clean architectural structure and integrates tools for validation, logging, and code quality enforcement.

## Features
- Modular architecture using NestJS
- API versioning support
- Real-time communication using WebSockets
- User authentication and session handling
- Role-based access control
- Environment-based configuration management
- Centralized error handling and response structure
- Utility and shared service layers
- ESLint and Prettier integration for code quality
- Developer documentation and task notes

## Tech Stack
- Runtime Environment: Node.js
- Language: TypeScript
- Framework: NestJS
- Database: MongoDB with Mongoose
- Authentication: JWT (likely)
- Real-time Communication: WebSocket
- Validation: class-validator
- Scheduling: (planned via node-cron or NestJS scheduler)
- Code Quality: ESLint, Prettier

## Dependencies
The following dependencies are used in this project:

## Core Dependencies
- @nestjs/common
- @nestjs/core
- @nestjs/mongoose
- @nestjs/platform-express
- mongoose
- rxjs
- bcryptjs
- dotenv
- class-validator
- class-transformer

## Development Dependencies
- @nestjs/cli
- @types/node
- ts-node
- typescript
- eslint
- eslint-config-prettier
- eslint-plugin-prettier
- prettier
- husky
- jest
- supertest
- npm-run-all

## Configuration
- The application uses various configuration files:
- .env - Environment variables
- config/ - App, database, and socket configurations
- eslint.config.mjs - ESLint configuration
- .prettierrc - Prettier configuration

## Available Scripts
- npm run start - Start the production server
- npm run dev - Start the development server with auto-reload
- npm run lint - Run ESLint
- npm run format - Format code using Prettier
- npm run build - Compile the TypeScript code
- npm run test - Run tests using Jest- 

## API Documentation
API endpoints are defined under versioned directories (src/v1/). Postman collection is provided:
- BaseFun.postman_collection.json

## Security
- Middleware-based authentication
- Role-based guards
- Input validation with class-validator
- Environment isolation using .env

## CI/CD Setup
This project uses Bitbucket Pipelines for continuous integration and deployment. The pipeline is configured to deploy the application to an EC2 instance whenever changes are pushed to the `main` branch.

### Pipeline Configuration
The following steps are executed in the pipeline:
1. SSH into the EC2 instance.
2. Navigate to the project directory.
3. Pull the latest changes from the repository.
4. Install dependencies.
5. Build the project.
6. Restart the application using PM2.

Here is the relevant configuration from `bitbucket-pipelines.yml`:

