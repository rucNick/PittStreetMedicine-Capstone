# StreetMed Backend API Documentation

## Table of Contents
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Authentication API](#authentication-api)
  - [Register](#register)
  - [Login](#login)
  - [Admin Access](#admin-access)
- [Order API](#order-api)
  - [Create Order](#create-order)
  - [View Orders](#view-orders)
  - [Update Order Status](#update-order-status)
  - [Cancel Order](#cancel-order)
- [Business Logic](#business-logic)
  - [Authentication Flow](#authentication-flow)
  - [Order Flow](#order-flow)
  - [Access Control](#access-control)

## Technology Stack
- Spring Boot 3.x
- Java 17
- SQLite Database
- JPA/Hibernate
- Maven

## Project Structure
```
com.backend.streetmed_backend/
├── controller/
│   ├── AuthController.java
│   └── OrderController.java
├── entity/
│   ├── user_entity/
│   │   ├── User.java
│   │   └── UserMetadata.java
│   └── order_entity/
│       ├── Order.java
│       └── OrderItem.java
├── repository/
│   ├── UserRepository.java
│   ├── UserMetadataRepository.java
│   ├── OrderRepository.java
│   └── OrderItemRepository.java
└── service/
    ├── UserService.java
    └── OrderService.java
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

Error Response:
{
    "status": "error",
    "message": "Error message"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

Request Body:
{
    "username": "string",
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

Error Response:
{
    "status": "error",
    "message": "Invalid credentials",
    "authenticated": false
}
```

### Admin Access

#### Admin get all users
```http
GET /api/auth/users

Request Body:
{
    "authenticated": true,
    "userId": number,
    "userRole": "ADMIN"
}

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

#### Admin delete users
```http
Delete /api/auth/delete


Request Body:
{
  "authenticated": "true",
  "adminUsername": "string",
  "username": "userToDelete"
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

Response:
{
    "status": "success",
    "message": "Order created successfully",
    "orderId": number,
    "authenticated": true
}
```

### View Orders

#### Get All Orders (Volunteer Only)
```http
GET /api/orders/all

Request Body:
{
    "authenticated": true,
    "userId": number,
    "userRole": "VOLUNTEER"
}

Response:
{
    "status": "success",
    "orders": [...],
    "authenticated": true
}
```

#### Get User Orders
```http
GET /api/orders/user/{targetUserId}

Request Body:
{
    "authenticated": true,
    "userId": number,
    "userRole": string
}

Response:
{
    "status": "success",
    "orders": [...],
    "authenticated": true
}
```

### Update Order Status
```http
PUT /api/orders/{orderId}/status

Request Body:
{
    "authenticated": true,
    "userId": number,
    "userRole": "VOLUNTEER",
    "status": string  // "PENDING", "PROCESSING", "COMPLETED", "CANCELLED"
}

Response:
{
    "status": "success",
    "message": "Order status updated successfully",
    "orderStatus": string,
    "authenticated": true
}
```

### Cancel Order
```http
POST /api/orders/{orderId}/cancel

Request Body:
{
    "authenticated": true,
    "userId": number,
    "userRole": string
}

Response:
{
    "status": "success",
    "message": "Order cancelled successfully",
    "authenticated": true
}
```

## Business Logic

### Authentication Flow
1. **Registration**
   - Users can only register as CLIENT role
   - System creates user metadata automatically
   - Email uniqueness is validated
   - Phone number is optional

2. **Login Process**
   - Validates username and password
   - Updates last login timestamp
   - Returns user role and authentication status
   - Maintains session information

3. **Admin Access**
   - Protected admin endpoints
   - Role-based access control
   - User management capabilities

### Order Flow
1. **Order Creation**
   - Must be authenticated
   - Requires delivery address
   - At least one item required
   - Optional location coordinates
   - Initial status: PENDING

2. **Order Management**
   - Client Permissions:
     - Create new orders
     - View own orders
     - Cancel own orders
   - Volunteer Permissions:
     - View all orders
     - Update order status
     - Cancel any order

3. **Order Status Lifecycle**
   ```
   [Created] -> PENDING -> PROCESSING -> COMPLETED
                    |          |
                    |          v
                    +-------> CANCELLED
   ```

### Access Control
1. **Authentication Required**
   - All endpoints require authenticated status
   - Authentication status checked in request body

2. **Role-Based Access**
   - CLIENT: Limited to own orders
   - VOLUNTEER: Access to all orders
   - ADMIN: Full system access

3. **Error Handling**
   - Authentication errors (401)
   - Authorization errors (403)
   - Validation errors (400)
   - Server errors (500)