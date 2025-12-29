
# HRMS – Social Connect

HRMS – Social Connect is a full-stack Human Resource Management System with an integrated social platform.  
It combines core HR functionality with a social feed and real-time communication to improve internal engagement within an organization.

The project follows a client–server architecture and is built for scalability and real-world usage.

---

## Core Features

### Authentication & Security
- Secure user authentication using **JWT**
- Password hashing with **bcrypt**
- Role-based user handling (e.g. employee, admin)
- HTTP-only cookies for session handling

### Social Feed
- Post creation with text and media
- Centralized feed for organization-wide visibility
- MongoDB-backed post storage
- APIs for creating, fetching, and syncing posts

### Real-Time Chat
- Real-time messaging using **Socket.IO**
- WebSocket-based communication layer
- Scalable event-driven architecture

### HR-Oriented Structure
- Event and recognition systems
- Modular route-based API design
- MongoDB integration for persistent data storage

---

## Tech Stack

### Frontend
- React
- Vite
- JavaScript

### Backend
- Node.js
- Express.js
- MongoDB
- Socket.IO

### Security & Auth
- bcrypt (password hashing)
- JSON Web Tokens (JWT)
- Cookie-based authentication

---

## Project Structure

HRMS-Social-Connect/
│
├── client/                 # React + Vite frontend
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                 # Node + Express backend
│   ├── routes/             # API routes (auth, posts, events)
│   ├── models/             # MongoDB schemas
│   ├── config/             # Database configuration
│   ├── index.js            # Server entry point
│   └── package.json
│
└── README.md

---

## Getting Started

### Clone the repository

git clone https://github.com/ThatGuySid/HRMS-Social-Connect.git  
cd HRMS-Social-Connect

---

### Frontend Setup

cd client  
npm install  
npm run dev  

Frontend runs at:

http://localhost:5173

---

### Backend Setup

cd server  
npm install  
npm start  

Backend runs on:

http://localhost:5000

---

## Environment Variables

Create a `.env` file inside the `server` directory.

Example:

JWT_SECRET=your_jwt_secret  
MONGO_URI=your_mongodb_connection_string  
CLIENT_URL=http://localhost:5173  

Environment files are ignored by Git for security reasons.

---

## API Overview

- /api/auth        → Authentication routes
- /api/posts       → Feed & post management
- /api/events      → HR events
- WebSocket layer  → Real-time chat via Socket.IO

---

## Current Status

🚧 Active development  
Features, structure, and UI are evolving as the system matures.

---

## Author

Sid  
GitHub: https://github.com/ThatGuySid
