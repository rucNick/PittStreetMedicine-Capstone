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
- [Volunteer API](#volunteer-api)
  - [Submit Volunteer Application](#submit-volunteer-application)
  - [Get All Applications (Admin Only)](#get-all-applications-admin-only)
  - [Get Pending Applications (Admin Only)](#get-pending-applications-admin-only)
  - [Check Volunteer Application Status](#check-volunteer-application-status)
  - [Approve Volunteer Application](#approve-volunteer-application)
  - [Reject Volunteer Application](#reject-volunteer-application)
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
DELETE /api/auth/delete


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

## Volunteer API

### Submit Volunteer Application
**Endpoint:** `POST /api/volunteer/apply`  
**Description:** Allows a user to submit an application to become a volunteer.

```http
POST /api/volunteer/apply
Content-Type: application/json

Request Body:
{
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "notes": "string"  // optional
}

Response:
{
    "status": "success",
    "message": "Application submitted successfully",
    "applicationId": number
}

Error Response:
{
    "status": "error",
    "message": "Missing required fields" // or conflict error if an application exists
}
```

### Get All Applications (Admin Only)
**Endpoint:** `GET /api/volunteer/applications`  
**Description:** Returns all volunteer applications grouped by status. Only accessible by an admin.

**Headers:**
- `Admin-Username: string`
- `Authentication-Status: "true"`

```http
GET /api/volunteer/applications
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "pending": [ { application objects } ],
        "approved": [ { application objects } ],
        "rejected": [ { application objects } ]
    }
}
```

**Error Response:**
```json
{
    "status": "error",
    "message": "Not authenticated"  // or "Unauthorized access"
}
```

### Get Pending Applications (Admin Only)
**Endpoint:** `GET /api/volunteer/pending`  
**Description:** Retrieves only the pending volunteer applications.

**Headers:**
- `Admin-Username: string`
- `Authentication-Status: "true"`

```http
GET /api/volunteer/pending
```

**Response:**
```json
{
    "status": "success",
    "data": [ { application objects } ]
}
```

**Error Response:**
```json
{
    "status": "error",
    "message": "Not authenticated"  // or appropriate error message
}
```

### Check Volunteer Application Status
**Endpoint:** `GET /api/volunteer/application/status/{email}`  
**Description:** Checks the status of a volunteer application based on the applicant's email.

```http
GET /api/volunteer/application/status/{email}
```

**Response:**
```json
{
    "status": "success",
    "applicationId": integer,
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "applicationStatus": "PENDING | APPROVED | REJECTED",
    "notes": "string",
    "submissionDate": "datetime"
}
```

**Error Response:**
```json
{
    "status": "error",
    "message": "No application found for this email"
}
```

### Approve Volunteer Application
**Endpoint:** `POST /api/volunteer/approve`  
**Description:** Approves a volunteer application and creates a volunteer account with an initial password.

```http
POST /api/volunteer/approve
Content-Type: application/json

Request Body:
{
    "adminUsername": "string",
    "authenticated": "true",
    "applicationId": "number"
}

Response:
{
    "status": "success",
    "message": "Application approved and volunteer account created",
    "applicationId": number,
    "userId": number,
    "initialPassword": "streetmed@pitt"
}
```

**Error Response:**
```json
{
    "status": "error",
    "message": "Error message"
}
```

### Reject Volunteer Application
**Endpoint:** `POST /api/volunteer/reject`  
**Description:** Rejects a volunteer application.

```http
POST /api/volunteer/reject
Content-Type: application/json

Request Body:
{
    "adminUsername": "string",
    "authenticated": "true",
    "applicationId": "number"
}

Response:
{
    "status": "success",
    "message": "Application rejected",
    "applicationId": number
}
```

**Error Response:**
```json
{
    "status": "error",
    "message": "Error message"
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

### Volunteer Application Flow
- **Application Submission:**  
  - Volunteers submit an application via `/api/volunteer/apply` with required details.
  
- **Admin Review:**  
  - Admins can view all applications (or only pending ones) using `/api/volunteer/applications` or `/api/volunteer/pending`.
  
- **Application Status Check:**  
  - Applicants can check their status via `/api/volunteer/application/status/{email}`.
  
- **Approval / Rejection:**  
  - Approved applications trigger the creation of a volunteer account (initial password: `streetmed@pitt`) via `/api/volunteer/approve`.  
  - Applications may also be rejected via `/api/volunteer/reject`.

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
