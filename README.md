# Project Name - NestJS Backend

A comprehensive project management application built with NestJS, featuring real-time chat, user management, and payment integration.

## 🚀 Features

- **User Management**: Registration, authentication, and profile management
- **Real-time Chat**: WebSocket-based messaging system
- **File Upload**: AWS S3 integration for media storage
- **Payment Processing**: Stripe integration
- **Push Notifications**: Firebase Cloud Messaging
- **Internationalization**: Multi-language support
- **Scheduled Tasks**: Cron jobs for automated tasks

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
   cd project_name
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
├── config/          # Configuration files
├── modules/         # Feature modules
│   └── v1/
│       ├── app/     # Public API endpoints
│       └── admin/   # Admin API endpoints
├── models/          # Database schemas
├── socket/          # WebSocket gateways
├── utils/           # Utility functions
├── cronjobs/        # Scheduled tasks
└── notification/    # Notification services
```

## 🔧 Available Scripts

- `pnpm run start:dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run start:prod` - Start production server
- `pnpm run test` - Run unit tests
- `pnpm run test:e2e` - Run e2e tests
- `pnpm run lint` - Lint code
- `pnpm run format` - Format code

## 🔐 Environment Variables

See `.env.example` for all required environment variables.

## 📚 API Documentation

API endpoints are versioned under `/v1/`:
- `/v1/app/` - Public endpoints
- `/v1/admin/` - Admin endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.