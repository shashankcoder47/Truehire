# TrueHire Backend API

A Node.js/Express backend API for the TrueHire job portal application.

## Features

- User authentication and authorization (JWT)
- Role-based access control (User, Recruiter, Admin)
- MySQL database integration
- Email notifications with Nodemailer
- RESTful API endpoints
- CORS enabled for frontend integration

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer
- **Password Hashing**: bcryptjs

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Installation

1. Clone the repository and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:
   ```env
   DB_HOST=your-rds-endpoint.amazonaws.com
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=truehire
   JWT_SECRET=your_jwt_secret_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   FRONTEND_URL=https://your-domain.com
   PORT=5000
   ```

4. Set up the MySQL database:
   - Create a database named `truehire`
   - Run the SQL scripts in `database/setup.sql` to create tables

### Database Setup

#### Option 1: Manual SQL Execution

Run the following SQL commands to create the required tables:

```sql
-- Create users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'recruiter', 'admin') DEFAULT 'user',
  profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create recruiters table
CREATE TABLE recruiters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  role ENUM('user', 'recruiter', 'admin') DEFAULT 'recruiter',
  profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create admins table
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'recruiter', 'admin') DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Option 2: Automated Setup Script

Alternatively, use the provided setup script:

```bash
mysql -u your_username -p your_database_name < backend/database/setup.sql
```

Replace `your_username`, `your_database_name` with your MySQL credentials.

### Running the Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

The server listens on the configured `PORT`; in production Nginx should proxy `/api` to that port.

## API Endpoints

### Authentication
- `POST /api/auth/register/user` - Register a new user
- `POST /api/auth/register/recruiter` - Register a new recruiter
- `POST /api/auth/register/admin` - Register a new admin
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/users/profile/me` - Get current user profile
- `PUT /api/users/profile/me` - Update current user profile

### Recruiters
- `GET /api/recruiters` - Get all recruiters (admin only)
- `GET /api/recruiters/:id` - Get recruiter by ID
- `PUT /api/recruiters/:id` - Update recruiter
- `DELETE /api/recruiters/:id` - Delete recruiter (admin only)
- `GET /api/recruiters/profile/me` - Get current recruiter profile
- `PUT /api/recruiters/profile/me` - Update current recruiter profile

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/recruiters` - Get all recruiters
- `GET /api/admin/users/:id` - Get user by ID
- `GET /api/admin/recruiters/:id` - Get recruiter by ID
- `PUT /api/admin/users/:id` - Update user
- `PUT /api/admin/recruiters/:id` - Update recruiter
- `DELETE /api/admin/users/:id` - Delete user
- `DELETE /api/admin/recruiters/:id` - Delete recruiter

### Health Check
- `GET /api/health` - Server health check

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

The API returns appropriate HTTP status codes and error messages in JSON format:

```json
{
  "message": "Error description"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
