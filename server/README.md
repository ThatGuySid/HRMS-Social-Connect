# HRMS Backend - Events API

## Overview
This is the backend API for the HRMS (Human Resource Management System) Events module built with Node.js, Express.js, and MongoDB.

## Features
- Create, read, update, and delete events
- Event categorization
- Date-based filtering
- Pagination support
- Input validation
- Error handling

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the server directory with:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hrms_events
NODE_ENV=development
JWT_SECRET=your-secure-jwt-secret-key
```

3. Start MongoDB service on your local machine

4. Start the server:
```bash
npm start
```

## API Endpoints

### Base URL: `http://localhost:8080/api`

### Events Endpoints

#### GET /events
Get all events with optional filtering and pagination
- Query parameters:
  - `category`: Filter by event category
  - `date`: Filter by specific date
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 50)

#### GET /events/:id
Get a single event by ID

#### POST /events
Create a new event
- Required fields: `title`, `description`, `location`, `time`, `date`
- Optional fields: `category`, `image`, `attendees`

#### PUT /events/:id
Update an existing event

#### DELETE /events/:id
Delete an event

#### GET /events/category/:category
Get events by specific category

#### GET /events/filter/upcoming
Get upcoming events

### Health Check
#### GET /health
Check if the server is running

## Event Model Schema

```javascript
{
  title: String (required, max 100 chars),
  description: String (required, max 1000 chars),
  category: String (enum: Company Meeting, Training, Team Building, Review, Wellness, Technology),
  time: String (required),
  location: String (required, max 200 chars),
  date: String (required),
  image: String (default: placeholder image),
  attendees: Number (default: 0),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-generated)
}
```

## Testing

Run the test script to verify all endpoints:
```bash
node test-api.js
```

## Error Handling
The API includes comprehensive error handling for:
- Validation errors
- Database connection issues
- Resource not found
- Duplicate entries
- Server errors

## CORS Configuration
The server is configured to accept requests from:
- http://localhost:3000 (Create React App)
- http://localhost:5173 (Vite React App)
- http://localhost:5174 (Vite React App - Alternative Port)

## Response Format
All API responses follow this format:
```javascript
{
  success: boolean,
  message?: string,
  data?: object,
  error?: string,
  count?: number,
  total?: number,
  pagination?: object
}
```
