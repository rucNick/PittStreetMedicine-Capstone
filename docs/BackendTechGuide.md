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
- [Cargo Management API](#cargo-management-api)
  - [Add Item](#add-cargo-item)
  - [Update Item](#update-cargo-item)
  - [Get Items](#get-cargo-items)
  - [Low Stock Items](#get-low-stock-items)
- [Cargo Image API](#cargo-image-api)
  - [Upload Image](#upload-image)
  - [Get Image](#get-image)
  - [Delete Image](#delete-image)
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
  - [Cargo Management Flow](#cargo-management-flow)
  - [Volunteer Application Flow](#volunteer-application-flow)
  - [Access Control](#access-control)

## Technology Stack
- Spring Boot 3.x
- Java 17
- SQLite Database
- MongoDB (for image storage)
- JPA/Hibernate
- Maven
- Cross-Origin Resource Sharing (CORS) enabled for localhost:3000

## Project Structure
```
com.backend.streetmed_backend/
├── controller/
│   ├── AuthController.java
│   ├── OrderController.java
│   ├── CargoController.java
│   ├── CargoImageController.java
│   └── VolunteerController.java
├── entity/
│   ├── user_entity/
│   │   ├── User.java
│   │   ├── UserMetadata.java
│   │   └── VolunteerApplication.java
│   ├── order_entity/
│   │   ├── Order.java
│   │   └── OrderItem.java
│   └── CargoItem.java
├── document/
│   └── CargoImage.java
├── repository/
│   ├── UserRepository.java
│   ├── UserMetadataRepository.java
│   ├── OrderRepository.java
│   ├── OrderItemRepository.java
│   ├── CargoItemRepository.java
│   ├── CargoImageRepository.java
│   └── VolunteerApplicationRepository.java
└── service/
    ├── UserService.java
    ├── OrderService.java
    ├── CargoItemService.java
    ├── CargoImageService.java
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
    "phoneNumber": "string" (optional),
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

Response:
{
    "status": "success",
    "message": "Guest order created successfully",
    "orderId": number,
    "orderStatus": "string"
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
Query Parameters:
  authenticated: boolean
  userRole: string
  userId: number

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
Content-Type: application/json

Request Body:
{
    "authenticated": true,
    "userId": number,
    "userRole": "VOLUNTEER",
    "status": "PENDING | PROCESSING | COMPLETED | CANCELLED"
}

Response:
{
    "status": "success",
    "message": "Order status updated successfully",
    "orderStatus": "string",
    "authenticated": true
}
```

### Cancel Order
```http
POST /api/orders/{orderId}/cancel
Content-Type: application/json

Request Body:
{
    "authenticated": true,
    "userId": number,
    "userRole": "string"
}

Response:
{
    "status": "success",
    "message": "Order cancelled successfully",
    "authenticated": true
}
```

## Cargo Management API

### Add Cargo Item
```http
POST /api/cargo/items
Content-Type: multipart/form-data

Headers:
  Admin-Username: string
  Authentication-Status: "true"

Form Data:
  data: {  // JSON object as blob
    "name": "string",
    "quantity": number,
    "description": "string" (optional),
    "category": "string" (optional),
    "minQuantity": number (optional),
    "sizeQuantities": {
      "S": number,
      "M": number,
      "L": number,
      "XL": number
    } (optional)
  }
  image: file (optional)

Response:
{
    "status": "success",
    "message": "Item added successfully",
    "itemId": number
}
```

### Update Cargo Item
```http
PUT /api/cargo/items/{id}
Content-Type: application/json

Headers:
  Admin-Username: string
  Authentication-Status: "true"

Request Body:
{
    "name": "string",
    "description": "string",
    "category": "string",
    "quantity": number,
    "minQuantity": number,
    "isAvailable": boolean,
    "needsPrescription": boolean,
    "sizeQuantities": {
        "S": number,
        "M": number,
        "L": number,
        "XL": number
    }
}

Response:
{
    "status": "success",
    "message": "Item updated successfully",
    "item": {
        // Updated item properties
    }
}
```

### Get Cargo Items
```http
GET /api/cargo/items

Response:
[
    {
        "id": number,
        "name": "string",
        "description": "string",
        "category": "string",
        "quantity": number,
        "sizeQuantities": {
            "S": number,
            "M": number,
            "L": number,
            "XL": number
        },
        "imageId": "string",
        "isAvailable": boolean,
        "minQuantity": number,
        "needsPrescription": boolean,
        "createdAt": "string (date-time)",
        "updatedAt": "string (date-time)"
    }
]
```

### Get Low Stock Items
```http
GET /api/cargo/items/low-stock

Headers:
  Admin-Username: string
  Authentication-Status: "true"

Response:
[
    {
        "id": number,
        "name": "string",
        "description": "string",
        "category": "string",
        "quantity": number,
        "minQuantity": number
        // Other item properties
    }
]
```

## Cargo Image API

### Upload Image
```http
POST /api/cargo/images/upload
Content-Type: multipart/form-data

Headers:
  Authentication-Status: "true"

Form Data:
  file: file (image)
  cargoItemId: number (optional)

Response:
{
    "status": "success",
    "imageId": "string",
    "message": "Image uploaded successfully"
}
```

### Get Image
```http
GET /api/cargo/images/{imageId}

Response:
  Binary image data with appropriate content-type
```

### Delete Image
```http
DELETE /api/cargo/images/{imageId}

Headers:
  Authentication-Status: "true"

Response:
{
    "status": "success",
    "message": "Image deleted successfully"
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

Response:
{
    "status": "success",
    "message": "Application submitted successfully",
    "applicationId": number
}
```

### Get All Applications (Admin Only)
```http
GET /api/volunteer/applications
Headers:
  Admin-Username: string
  Authentication-Status: "true"

Response:
{
    "status": "success",
    "data": {
        "pending": [
            {
                "applicationId": number,
                "firstName": "string",
                "lastName": "string",
                "email": "string",
                "phone": "string",
                "status": "PENDING",
                "notes": "string",
                "submissionDate": "string (date-time)"
            }
        ],
        "approved": [...],
        "rejected": [...]
    }
}
```

### Get Pending Applications (Admin Only)
```http
GET /api/volunteer/pending
Headers:
  Admin-Username: string
  Authentication-Status: "true"

Response:
{
    "status": "success",
    "data": [
        {
            "applicationId": number,
            "firstName": "string",
            "lastName": "string",
            "email": "string",
            "phone": "string",
            "notes": "string",
            "submissionDate": "string (date-time)"
        }
    ]
}
```

### Check Volunteer Application Status
```http
GET /api/volunteer/application/status/{email}

Response:
{
    "status": "success",
    "applicationId": number,
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "applicationStatus": "PENDING | APPROVED | REJECTED",
    "notes": "string",
    "submissionDate": "string (date-time)"
}
```

### Approve Volunteer Application
```http
POST /api/volunteer/approve
Content-Type: application/json

Request Body:
{
    "adminUsername": "string",
    "authenticated": "true",
    "applicationId": "string"
}

Response:
{
    "status": "success",
    "message": "Application approved and volunteer account created",
    "applicationId": number,
    "userId": number,
    "initialPassword": "string"
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
    "applicationId": "string"
}

Response:
{
    "status": "success",
    "message": "Application rejected",
    "applicationId": number
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

### Cargo Management Flow
1. **Inventory Management**
   - Admin can add items to inventory
   - Support for sized items (clothing sizes)
   - Optional image upload
   - Minimum quantity tracking

2. **Inventory Operations**
   - Update item quantities
   - Mark items as available/unavailable
   - Delete items from inventory
   - Track low stock items

3. **Image Management**
   - Upload images for items
   - Store images in MongoDB
   - Retrieve images by ID
   - Delete images when no longer needed

### Volunteer Application Flow
1. **Application Submission**
   - Open to all users
   - Required fields validation
   - Duplicate application prevention
   - Optional notes

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
   - ADMIN: Full system access including cargo management
   - GUEST: Limited order creation

3. **Security Measures**
   - Password hashing
   - Current password verification for sensitive changes
   - Input validation
   - CORS protection