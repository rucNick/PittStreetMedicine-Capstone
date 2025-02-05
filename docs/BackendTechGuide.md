```markdown
# StreetMed Backend API Documentation

## Table of Contents
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Authentication API](#authentication-api)
  - [Register](#register)
  - [Login](#login)
  - [Admin: List Users](#admin-list-users)
  - [Admin: Delete User](#admin-delete-user)
- [Order API](#order-api)
  - [Create Order](#create-order)
  - [Get Order Details](#get-order-details)
  - [Get User Orders](#get-user-orders)
  - [Get Orders by Status (Volunteer Only)](#get-orders-by-status-volunteer-only)
  - [Update Order Status (Volunteer Only)](#update-order-status-volunteer-only)
  - [Assign Volunteer (Volunteer Only)](#assign-volunteer-volunteer-only)
  - [Cancel Order](#cancel-order)
- [Error Handling](#error-handling)

## Technology Stack
- **Backend:** Spring Boot 3.x, Java 17  
- **Database:** SQLite  
- **Persistence:** JPA/Hibernate  
- **Build Tool:** Maven

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

All authentication endpoints return responses asynchronously using a `CompletableFuture`. Requests must include the appropriate headers as described below.

### Register
- **Method:** `POST`
- **URL:** `/api/auth/register`
- **Headers:**  
  _Content-Type: application/json_

#### Request Body
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "phone": "string"  // optional
}
```

#### Success Response (HTTP 200)
```json
{
  "status": "success",
  "message": "User registered successfully",
  "userId": 1
}
```

#### Error Response (HTTP 400)
```json
{
  "status": "error",
  "message": "Missing required fields"
}
```

### Login
- **Method:** `POST`
- **URL:** `/api/auth/login`
- **Headers:**  
  _Content-Type: application/json_

#### Request Body
```json
{
  "username": "string",
  "password": "string"
}
```

#### Success Response (HTTP 200)
```json
{
  "status": "success",
  "message": "Login successful",
  "userId": 1,
  "role": "CLIENT",        
  "authenticated": true,
  "username": "string",
  "email": "string"
}
```

#### Error Response (HTTP 401 or 500)
```json
{
  "status": "error",
  "message": "Invalid credentials",
  "authenticated": false
}
```

### Admin: List Users
- **Method:** `GET`
- **URL:** `/api/auth/users`
- **Required Headers:**
  - `Admin-Username: string`  _(username of the admin requesting the list)_
  - `Authentication-Status: true`

#### Success Response (HTTP 200)
```json
{
  "status": "success",
  "authenticated": true,
  "data": {
    "clients": [
      { "username": "client1", "role": "CLIENT" },
      { "username": "client2", "role": "CLIENT" }
    ],
    "volunteers": [
      { "username": "volunteer1", "role": "VOLUNTEER" }
    ],
    "admins": [
      { "username": "admin1", "role": "ADMIN" }
    ]
  }
}
```

#### Error Responses
- **HTTP 401 (Not Authenticated):**
```json
{
  "status": "error",
  "message": "Not authenticated",
  "authenticated": false
}
```
- **HTTP 403 (Unauthorized Access):**
```json
{
  "status": "error",
  "message": "Unauthorized access",
  "authenticated": true
}
```

### Admin: Delete User
- **Method:** `DELETE`
- **URL:** `/api/auth/delete`
- **Required Headers:**  
  _Content-Type: application/json_

#### Request Body
```json
{
  "authenticated": "true",
  "adminUsername": "string",
  "username": "userToDelete"
}
```

#### Success Response (HTTP 200)
```json
{
  "status": "success",
  "message": "User deleted successfully",
  "authenticated": true
}
```

#### Error Responses
- **HTTP 401 (Not Authenticated):**
```json
{
  "status": "error",
  "message": "Not authenticated",
  "authenticated": false
}
```
- **HTTP 403 (Unauthorized Access):**
```json
{
  "status": "error",
  "message": "Unauthorized access",
  "authenticated": true
}
```
- **HTTP 404 (User Not Found):**
```json
{
  "status": "error",
  "message": "User not found",
  "authenticated": true
}
```

## Order API

All order endpoints are handled asynchronously and require proper authentication headers. The endpoints use a combination of URL parameters, headers, and request bodies.

### Create Order
- **Method:** `POST`
- **URL:** `/api/orders/create`
- **Required Headers:**
  - `Authentication-Status: true`
  - `User-ID: number`  _(ID of the client creating the order)_

#### Request Body
```json
{
  "notes": "Please deliver between 2-3 PM",
  "deliveryAddress": "123 Main Street",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "items": [
    {
      "itemName": "Masks",
      "quantity": 2
    },
    {
      "itemName": "Gloves",
      "quantity": 3
    }
  ]
}
```

#### Success Response (HTTP 200)
```json
{
  "status": "success",
  "message": "Order created successfully",
  "orderId": 1,
  "authenticated": true
}
```

#### Error Response (HTTP 401/500)
```json
{
  "status": "error",
  "message": "Error message",
  "authenticated": true
}
```

### Get Order Details
- **Method:** `GET`
- **URL:** `/api/orders/{orderId}`
- **Required Headers:**
  - `Authentication-Status: true`
  - `User-Role: CLIENT` or `VOLUNTEER`
  - `User-ID: number`  _(ID of the requesting user)_

#### Success Response (HTTP 200)
```json
{
  "status": "success",
  "order": {
    "orderId": 1,
    "userId": 1,
    "notes": "Please deliver between 2-3 PM",
    "deliveryAddress": "123 Main Street",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "status": "PENDING"
  },
  "items": [
    {
      "itemName": "Masks",
      "quantity": 2
    },
    {
      "itemName": "Gloves",
      "quantity": 3
    }
  ]
}
```

### Get User Orders
- **Method:** `GET`
- **URL:** `/api/orders/user/{targetUserId}`
- **Required Headers:**
  - `Authentication-Status: true`
  - `User-Role: CLIENT` or `VOLUNTEER`
  - `User-ID: number`  _(ID of the requesting user)_

#### Success Response (HTTP 200)
```json
{
  "status": "success",
  "orders": [
    {
      "orderId": 1,
      "userId": 1,
      "notes": "Please deliver between 2-3 PM",
      "deliveryAddress": "123 Main Street",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "status": "PENDING"
    }
  ],
  "authenticated": true
}
```

### Get Orders by Status (Volunteer Only)
- **Method:** `GET`
- **URL:** `/api/orders/status/{status}`
- **Required Headers:**
  - `Authentication-Status: true`
  - `User-Role: VOLUNTEER`

#### Success Response (HTTP 200)
```json
{
  "status": "success",
  "orders": [
    {
      "orderId": 1,
      "userId": 1,
      "notes": "Please deliver between 2-3 PM",
      "deliveryAddress": "123 Main Street",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "status": "PENDING"
    }
  ]
}
```

#### Error Response (HTTP 401/403)
```json
{
  "status": "error",
  "message": "Only volunteers can view orders by status",
  "authenticated": true
}
```

### Update Order Status (Volunteer Only)
- **Method:** `PUT`
- **URL:** `/api/orders/{orderId}/status`
- **Required Headers:**
  - `Authentication-Status: true`
  - `User-Role: VOLUNTEER`
  - `User-ID: number`  _(ID of the volunteer)_

#### Request Body
```json
{
  "status": "PROCESSING"
}
```

#### Success Response (HTTP 200)
```json
{
  "status": "success",
  "message": "Order status updated successfully",
  "orderStatus": "PROCESSING",
  "authenticated": true
}
```

### Assign Volunteer (Volunteer Only)
- **Method:** `POST`
- **URL:** `/api/orders/{orderId}/assign`
- **Required Headers:**
  - `Authentication-Status: true`
  - `User-Role: VOLUNTEER`

#### Request Body
```json
{
  "volunteerId": 2
}
```

#### Success Response (HTTP 200)
```json
{
  "status": "success",
  "message": "Volunteer assigned successfully",
  "orderId": 1,
  "volunteerId": 2
}
```

### Cancel Order
- **Method:** `POST`
- **URL:** `/api/orders/{orderId}/cancel`
- **Required Headers:**
  - `Authentication-Status: true`
  - `User-Role: CLIENT` or `VOLUNTEER`
  - `User-ID: number`  _(ID of the requesting user)_

#### Success Response (HTTP 200)
```json
{
  "status": "success",
  "message": "Order cancelled successfully",
  "authenticated": true
}
```

## Error Handling

Every endpoint returns a standardized error response in the following format:

```json
{
  "status": "error",
  "message": "Detailed error message",
  "authenticated": true  // or false, as applicable
}
```

Standard HTTP status codes used:
- **401 Unauthorized**
- **403 Forbidden**
- **400 Bad Request**
- **500 Internal Server Error**
```