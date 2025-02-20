# StreetMed Backend API Documentation

## Table of Contents
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Authentication API](#authentication-api)
  - [Register](#register)
  - [Login](#login)
  - [Profile Management](#profile-management)
  - [Admin Access](#admin-access)
- [Order API](#order-api)
  - [Create Order](#create-order)
  - [Create Guest Order](#create-guest-order)
  - [View Orders](#view-orders)
  - [Update Order Status](#update-order-status)
  - [Cancel Order](#cancel-order)
- [Volunteer API](#volunteer-api)
  - [Submit Application](#submit-volunteer-application)
  - [Get All Applications](#get-all-applications-admin-only)
  - [Get Pending Applications](#get-pending-applications-admin-only)
  - [Check Application Status](#check-volunteer-application-status)
  - [Approve Application](#approve-volunteer-application)
  - [Reject Application](#reject-volunteer-application)
- [Business Logic](#business-logic)
  - [Authentication Flow](#authentication-flow)
  - [Order Flow](#order-flow)
  - [Volunteer Application Flow](#volunteer-application-flow)
  - [Access Control](#access-control)

## Technology Stack
- Spring Boot 3.x
- Java 17
- SQLite Database
- JPA/Hibernate
- Maven
- Cross-Origin Resource Sharing (CORS) enabled for localhost:3000

## Project Structure
```
com.backend.streetmed_backend/
├── controller/
│   ├── AuthController.java
│   ├── OrderController.java
│   └── VolunteerController.java
├── entity/
│   ├── user_entity/
│   │   ├── User.java
│   │   ├── UserMetadata.java
│   │   └── VolunteerApplication.java
│   └── order_entity/
│       ├── Order.java
│       └── OrderItem.java
├── repository/
│   ├── UserRepository.java
│   ├── UserMetadataRepository.java
│   ├── OrderRepository.java
│   ├── OrderItemRepository.java
│   └── VolunteerApplicationRepository.java
└── service/
    ├── UserService.java
    ├── OrderService.java
    └── VolunteerApplicationService.java
```

## Authentication API

### Register
```http
POST /api/auth/register
Content-Type: application/json

Request Body:
{
    "username": "string",
    "email": "string",
    "password": "string",
    "phone": "string" (optional)
}

Response:
{
    "status": "success",
    "message": "User registered successfully",
    "userId": number
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

Request Body:
{
    "username": "string",  // Can be username or email
    "password": "string"
}

Response:
{
    "status": "success",
    "message": "Login successful",
    "userId": number,
    "role": string,
    "authenticated": true,
    "username": string,
    "email": string
}
```

### Profile Management

#### Update Username
```http
PUT /api/auth/update/username
Content-Type: application/json

Request Body:
{
    "userId": "string",
    "newUsername": "string",
    "authenticated": "true"
}

Response:
{
    "status": "success",
    "message": "Username updated successfully",
    "username": "string"
}
```

#### Update Password
```http
PUT /api/auth/update/password
Content-Type: application/json

Request Body:
{
    "userId": "string",
    "currentPassword": "string",
    "newPassword": "string",
    "authenticated": "true"
}

Response:
{
    "status": "success",
    "message": "Password updated successfully"
}
```

#### Update Email
```http
PUT /api/auth/update/email
Content-Type: application/json

Request Body:
{
    "userId": "string",
    "currentPassword": "string",
    "newEmail": "string",
    "authenticated": "true"
}

Response:
{
    "status": "success",
    "message": "Email updated successfully",
    "email": "string"
}
```

### Admin Access

#### Get All Users
```http
GET /api/auth/users
Headers:
  Admin-Username: string
  Authentication-Status: "true"

Response:
{
    "status": "success",
    "authenticated": true,
    "data": {
        "clients": [...],
        "volunteers": [...],
        "admins": [...]
    }
}
```

#### Delete User
```http
DELETE /api/auth/delete
Content-Type: application/json

Request Body:
{
    "authenticated": "true",
    "adminUsername": "string",
    "username": "string"
}

Response:
{
    "status": "success",
    "message": "User deleted successfully",
    "authenticated": true
}
```

## Order API

### Create Order
```http
POST /api/orders/create
Content-Type: application/json

Request Body:
{
    "authenticated": true,
    "userId": number,
    "deliveryAddress": "string",
    "notes": "string",
    "latitude": number (optional),
    "longitude": number (optional),
    "items": [
        {
            "itemName": "string",
            "quantity": number
        }
    ]
}
```

### Create Guest Order
```http
POST /api/orders/guest/create
Content-Type: application/json

Request Body:
{
    "firstName": "string",
    "lastName": "string",
    "email": "string" (optional),
    "phone": "string" (optional),
    "deliveryAddress": "string",
    "notes": "string",
    "items": [
        {
            "itemName": "string",
            "quantity": number
        }
    ]
}
```

### View Orders

#### Get All Orders (Volunteer Only)
```http
GET /api/orders/all
Content-Type: application/json

Request Body:
{
    "authenticated": true,
    "userId": number,
    "userRole": "VOLUNTEER"
}
```

#### Get User Orders
```http
GET /api/orders/user/{targetUserId}
Query Parameters:
  authenticated: boolean
  userRole: string
  userId: number
```

### Update Order Status
```http
PUT /api/orders/{orderId}/status
Content-Type: application/json

Request Body:
{
    "authenticated": true,
    "userId": number,
    "userRole": "VOLUNTEER",
    "status": "PENDING | PROCESSING | COMPLETED | CANCELLED"
}
```

## Volunteer API

### Submit Volunteer Application
```http
POST /api/volunteer/apply
Content-Type: application/json

Request Body:
{
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "notes": "string" (optional)
}
```

### Get All Applications (Admin Only)
```http
GET /api/volunteer/applications
Headers:
  Admin-Username: string
  Authentication-Status: "true"
```

### Get Pending Applications (Admin Only)
```http
GET /api/volunteer/pending
Headers:
  Admin-Username: string
  Authentication-Status: "true"
```

### Check Volunteer Application Status
```http
GET /api/volunteer/application/status/{email}
```

### Approve Volunteer Application
```http
POST /api/volunteer/approve
Content-Type: application/json

Request Body:
{
    "adminUsername": "string",
    "authenticated": "true",
    "applicationId": "number"
}
```

### Reject Volunteer Application
```http
POST /api/volunteer/reject
Content-Type: application/json

Request Body:
{
    "adminUsername": "string",
    "authenticated": "true",
    "applicationId": "number"
}
```

## Business Logic

### Authentication Flow
1. **Registration**
   - Users can only register as CLIENT role
   - System creates user metadata automatically
   - Email and username uniqueness is validated
   - Phone number is optional

2. **Login Process**
   - Validates username/email and password
   - Updates last login timestamp
   - Returns user role and authentication status

3. **Profile Management**
   - Users can update their username
   - Password changes require current password verification
   - Email changes require current password verification
   - All updates check for conflicts with existing users

4. **Admin Access**
   - Protected admin endpoints with role verification
   - User management capabilities
   - System-wide operations (e.g., password migration)

### Order Flow
1. **Order Creation**
   - Supports both authenticated and guest orders
   - Requires delivery address and at least one item
   - Optional coordinates and notes
   - Initial status: PENDING

2. **Order Management**
   - Client Permissions:
     - Create orders
     - View own orders
     - Cancel own orders
   - Volunteer Permissions:
     - View all orders
     - Update order status
     - Process orders
   - Guest Orders:
     - Basic order creation
     - No authentication required
     - Limited tracking capabilities

3. **Order Status Lifecycle**
```
[Created] -> PENDING -> PROCESSING -> COMPLETED
                |          |
                |          v
                +-------> CANCELLED
```

### Volunteer Application Flow
1. **Application Submission**
   - Open to all users
   - Required fields validation
   - Duplicate application prevention

2. **Application Processing**
   - Admin review system
   - Status tracking
   - Email-based lookup

3. **Account Creation**
   - Automatic volunteer account creation upon approval
   - Initial password provision
   - Role assignment

### Access Control
1. **Authentication Requirements**
   - Most endpoints require authentication
   - Guest services for limited operations
   - Token-based session management

2. **Role-Based Access**
   - CLIENT: Self-service operations
   - VOLUNTEER: Extended order management
   - ADMIN: Full system access
   - GUEST: Limited order creation

3. **Security Measures**
   - Password hashing
   - Current password verification for sensitive changes
   - Input validation
   - CORS protection