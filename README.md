# Pet App - NestJS Backend

A comprehensive pet management application built with NestJS, featuring real-time chat, user management, and payment integration.

## 🚀 Features

- **User Management**: Registration, authentication, and profile management
- **Role-Based Access Control**: Admin and user guards enforce scoped access
- **Security & Rate Limiting**: Global request throttling using @nestjs/throttler
- **Real-time Chat**: WebSocket-based messaging system
- **File Upload**: AWS S3 integration for media storage
- **Payment Processing**: Stripe integration
- **Push Notifications**: Firebase Cloud Messaging
- **Internationalization**: Multi-language support
- **Scheduled Tasks**: Cron jobs for automated tasks
- **Centralized Logging**: NestJS Logger across the codebase

## 🛠️ Tech Stack

- **Framework**: NestJS v11
- **Language**: TypeScript 5.7
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Real-time**: Socket.io
- **File Storage**: AWS S3
- **Payments**: Stripe
- **Notifications**: Firebase
- **Package Manager**: pnpm

## 📋 Prerequisites

- Node.js 18+
- MongoDB
- AWS S3 Bucket
- Stripe Account
- Firebase Project

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pet
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run the application**
   ```bash
   # Development
   pnpm run start:dev
   
   # Production
   pnpm run build
   pnpm run start:prod
   ```

## 📁 Project Structure

```
src/
├── common/           # Shared utilities, guards, decorators
├── config/           # Configuration files
├── modules/          # Feature modules
│   └── v1/
│       ├── app/      # Public API endpoints
│       └── admin/    # Admin API endpoints
├── models/           # Database schemas
├── socket/           # WebSocket gateways
├── i18n/             # Translation files
├── utils/            # Utility functions
├── cronjobs/         # Scheduled tasks
└── notification/     # Notification services
```

## 🔧 Available Scripts

- `pnpm run start:dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run start:prod` - Start production server
- `pnpm run test` - Run unit tests
- `pnpm run test:e2e` - Run e2e tests
- `pnpm run lint` - Lint code
- `pnpm run format` - Format code

## 🏗️ Architecture Overview

![Architecture Diagram](docs/architecture.svg)

```mermaid
graph TD
  Client[Web / Mobile App]
  Gateway[API Gateway (NestJS)]
  WS[WebSocket Gateway]
  Mongo[(MongoDB)]
  Redis[(Redis)]
  S3[(AWS S3)]
  Stripe[(Stripe)]
  Firebase[(Firebase FCM)]
  Gateway --> Mongo
  Gateway --> Redis
  Gateway --> Stripe
  Gateway --> S3
  Gateway -.-> Firebase
  WS --> Redis
```

The backend is a modular NestJS application organised by domain-driven modules inside `src/`. Core layers:

- **Controllers** – REST endpoints under `/v1/app` & `/v1/admin`.
- **Guards / Interceptors** – auth, roles, rate-limit.
- **Services** – business logic.
- **Models** – Mongoose schemas.
- **Gateways** – real-time chat (Socket.io).
- **Cronjobs** – scheduled background tasks.

## 🔐 Environment & Runtime Dependencies

Service | Purpose | Required ENV(s)
--- | --- | ---
MongoDB | Persistence | `MONGODB_URI`
Redis | Cache, queues, rate-limit store | `REDIS_URL`
AWS S3 | Media storage | `BUCKET_NAME`, `ACCESSKEYID`, `SECRETACCESSKEY`, `BUCKET_URL`
Stripe | Payments | `STRIPE_SECRET_KEY`
Firebase | Push notifications | `PROJECT_ID`, `FIREBASE_SA_PATH`
JWT | Auth tokens | `TOKEN_KEY`, `TOKEN_EXPIRES_IN`, `TOKEN_ISSUER`, `TOKEN_AUDIENCE`
Throttler | Rate limiting | `RATE_LIMIT_TTL`, `RATE_LIMIT_LIMIT`

Duplicate `.env.example` to `.env` and fill in **all** blanks:

```bash
cp .env.example .env
```

## 🚢 Deployment

### Local development

1. Ensure MongoDB & Redis are running (native or Docker):
   ```bash
   docker run -d --name mongo -p 27017:27017 mongo:7
   docker run -d --name redis -p 6379:6379 redis:7
   ```
2. Install dependencies & start the server:
   ```bash
   pnpm install
   pnpm run start:dev
   ```

### Docker (manual)

```bash
docker build -t pet-api .
docker run --env-file .env -p 3000:3000 pet-api
```

### Production

1. Build assets: `pnpm run build`
2. Start: `pnpm run start:prod`
3. Place behind a reverse proxy (Nginx, Traefik) and ensure `X-Forwarded-*` headers are forwarded for accurate rate-limiting.

## 📚 API Endpoints

Version | Path | Description
--- | --- | ---
v1 | `/v1/app/*` | User-facing endpoints
v1 | `/v1/admin/*` | Admin-protected endpoints

Swagger/OpenAPI docs planned for `/api-docs` (TODO).

## 📈 Roadmap

High-level upcoming milestones:

- Migrate rate-limit store to Redis (✅ done).
- Add Swagger UI docs (`/api-docs`).
- Finish integration test coverage ≥ 80%.

## 🤝 Contributing

Please read the [Contributing Guide](CONTRIBUTING.md) before submitting pull requests.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.