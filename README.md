# Quest Master Guide

A comprehensive learning platform for test preparation and resource sharing.

## Features

- User Authentication (Signup/Login)
- Role-based Access Control (Admin/User)
- Test Management
  - Create and manage tests
  - Take tests with time tracking
  - View test results
- Resource Management
  - Share learning resources
  - Categorize and tag resources
  - Track resource views

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: MongoDB
- Authentication: JWT
- Styling: Tailwind CSS

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd quest-master-guide
   ```

2. Install dependencies:
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd ../server
   npm install
   cd ../quest-master-guide
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration values.

4. Start MongoDB:
   ```bash
   # Make sure MongoDB is running on your system
   # Default port: 27017
   ```

5. Start the development server:
   ```bash
   # To run both frontend and backend
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:client` - Start frontend development server
- `npm run dev:server` - Start backend development server
- `npm run build` - Build the project
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run preview` - Preview the production build

## API Endpoints

### Authentication
- POST `/api/auth/signup` - Register a new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user

### Tests
- POST `/api/tests` - Create a new test (Admin only)
- GET `/api/tests` - Get all tests
- GET `/api/tests/:id` - Get a specific test
- POST `/api/tests/:id/submit` - Submit test answers
- GET `/api/tests/results` - Get user's test results

### Resources
- POST `/api/resources` - Create a new resource
- GET `/api/resources` - Get all resources
- GET `/api/resources/:id` - Get a specific resource
- PATCH `/api/resources/:id` - Update a resource
- DELETE `/api/resources/:id` - Delete a resource

## Project Structure

```
quest-master-guide/
├── src/
│   ├── components/    # React components
│   ├── pages/        # Page components
│   ├── hooks/        # Custom hooks
│   ├── lib/          # Configuration and utilities
│   └── App.tsx       # Main App component
│
├── server/           # Backend code
│   ├── controllers/  # Route controllers
│   ├── middleware/   # Custom middleware
│   ├── routes/       # API routes
│   ├── utils/        # Utility functions
│   ├── validators/   # Input validation
│   ├── db/           # Database connection
│   └── index.ts      # Server entry point
│
├── public/           # Static assets
├── .env.example      # Example environment variables
├── package.json      # Project dependencies
└── README.md         # Project documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
