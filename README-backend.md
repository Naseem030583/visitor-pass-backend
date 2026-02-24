# Visitor Pass Management System - Backend API

A full-stack MERN application backend for managing visitor passes with JWT authentication, role-based access control, QR code generation, and PDF badge generation.

## Live Demo

- **Backend API:** https://visitor-pass-backend-azj3.onrender.com
- **Frontend App:** https://naseem-visitor-pass-frontend.netlify.app

## Demo Credentials

| Role     | Email                  | Password    |
|----------|------------------------|-------------|
| Admin    | admin@visitor.com      | admin123    |
| Security | security@visitor.com   | security123 |
| Employee | naseem@visitor.com     | naseem123   |

## Features

- JWT Authentication with role-based authorization (Admin, Security, Employee)
- Visitor Registration with photo upload (base64 stored in MongoDB)
- QR Code generation for each visitor pass
- PDF Badge generation with visitor details, photo, and QR code
- Visitor approval workflow (pending → approved)
- Check-In / Check-Out system using pass codes
- Dashboard statistics (total, pending, approved, checked-in, checked-out)
- RESTful API design with Controller-Service-Route pattern

## Tech Stack

- Runtime: Node.js with Express.js
- Database:MongoDB Atlas with Mongoose
- Authentication:JWT (jsonwebtoken) + bcryptjs
- File Upload:Multer (memory storage for cloud compatibility)
- QR Code:qrcode package
- PDF:PDFKit
- Deployment:Render

## API Endpoints

### Auth Routes (`/api/auth`)

| Method | Endpoint   | Access  | Description          |
|--------|------------|---------|----------------------|
| POST   | /register  | Public  | Register new user    |
| POST   | /login     | Public  | Login and get token  |
| GET    | /profile   | Private | Get current user     |
| GET    | /users     | Admin   | Get all users        |

### Visitor Routes (`/api/visitors`)

| Method | Endpoint          | Access          | Description            |
|--------|-------------------|-----------------|------------------------|
| POST   | /                 | Private         | Create visitor         |
| GET    | /                 | Private         | Get all visitors       |
| GET    | /:id              | Private         | Get visitor by ID      |
| PUT    | /:id              | Private         | Update visitor         |
| PATCH  | /:id/approve      | Admin/Employee  | Approve visitor        |
| POST   | /check-in         | Admin/Security  | Check-in visitor       |
| POST   | /check-out        | Admin/Security  | Check-out visitor      |
| DELETE | /:id              | Admin           | Delete visitor         |
| GET    | /stats            | Admin/Security  | Dashboard statistics   |
| GET    | /:id/pdf          | Private         | Download PDF badge     |

## Project Structure

visitor-pass-backend/
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   └── visitorController.js
├── middleware/
│   ├── auth.js
│   └── upload.js
├── models/
│   ├── User.js
│   └── Visitor.js
├── routes/
│   ├── authRoutes.js
│   └── visitorRoutes.js
├── services/
│   ├── authService.js
│   └── visitorService.js
├── .env
├── .gitignore
├── index.js
├── package.json
└── api-test.http


## Setup Instructions

1. Clone the repository:
   git clone https://github.com/Naseem030583/visitor-pass-backend.git
   cd visitor-pass-backend

2. Install dependencies:
   npm install

3. Create `.env` file:
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key

4. Start the server:
   npm run dev

5. Server runs at `http://localhost:3000`

