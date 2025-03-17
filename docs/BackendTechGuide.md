# StreetMed Backend API Documentation

## Table of Contents
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Authentication API](#authentication-api)
  - [Register](#register)
  - [Login](#login)
  - [Profile Management](#profile-management)
  - [Password Recovery](#password-recovery)
- [Email Service](#email-service)
  - [Email Configuration](#email-configuration)
- [Admin API](#admin-api)
  - [User Management](#user-management)
  - [Password Operations](#password-operations)
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
- [Feedback API](#feedback-api)
  - [Submit Feedback](#submit-feedback)
  - [Get All Feedback](#get-all-feedback)
  - [Delete Feedback](#delete-feedback)
  - [Search Feedback](#search-feedback)
- [Volunteer API](#volunteer-api)
  - [Submit Application](#submit-volunteer-application)
  - [Get All Applications](#get-all-applications-admin-only)
  - [Get Pending Applications](#get-pending-applications-admin-only)
  - [Check Application Status](#check-volunteer-application-status)
  - [Approve Application](#approve-volunteer-application)
  - [Reject Application](#reject-volunteer-application)
- [Business Logic](#business-logic)
  - [Authentication Flow](#authentication-flow)
  - [Password Recovery Flow](#password-recovery-flow)
  - [Email Notification System](#email-notification-system)
  - [Order Flow](#order-flow)
  - [Cargo Management Flow](#cargo-management-flow)
  - [Order-Inventory Integration](#order-inventory-integration)
  - [Feedback Management](#feedback-management)
  - [Volunteer Application Flow](#volunteer-application-flow)
  - [Access Control](#access-control)

## Technology Stack
- Spring Boot 3.x
- Java 17
- SQLite Database
- MongoDB (for image storage)
- JPA/Hibernate
- Spring Mail (for email notifications)
- Maven
- Cross-Origin Resource Sharing (CORS) enabled for localhost:3000

## Project Structure
```
com.backend.streetmed_backend/
├── controller/
│   ├── Auth/
│   │   ├── AuthController.java
│   │   ├── AdminController.java
│   │   └── PasswordRecoveryController.java
│   ├── Inventory/
│   │   ├── CargoController.java
│   │   └── CargoImageController.java
│   ├── Order/
│   │   └── OrderController.java
│   └── Services/
│       ├── FeedbackController.java
│       └── VolunteerController.java
├── config/
│   ├── AsyncConfig.java
│   ├── DatabaseConfig.java
│   ├── MailConfig.java
│   └── MongoConfig.java
├── entity/
│   ├── user_entity/
│   │   ├── User.java
│   │   ├── UserMetadata.java
│   │   └── VolunteerApplication.java
│   ├── order_entity/
│   │   ├── Order.java
│   │   └── OrderItem.java
│   ├── Service_entity/
│   │   └── Feedback.java
│   └── CargoItem.java
├── document/
│   └── CargoImage.java
├── repository/
│   ├── Cargo/
│   │   ├── CargoItemRepository.java
│   │   └── CargoImageRepository.java
│   ├── Order/
│   │   ├── OrderRepository.java
│   │   └── OrderItemRepository.java
│   ├── User/
│   │   ├── UserMetadataRepository.java
│   │   └── UserRepository.java
│   ├── FeedbackRepository.java
│   └── VolunteerApplicationRepository.java
├── service/
|    ├── UserService.java
|    ├── OrderService.java
|    ├── CargoItemService.java
|    ├── CargoImageService.java
|    ├── EmailService.java
|    ├── FeedbackService.java
|    └── VolunteerApplicationService.java
|── Security/
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

#### Update Phone Number
```http
PUT /api/auth/update/phone
Content-Type: application/json

Request Body:
{
    "userId": "string",
    "currentPassword": "string",
    "newPhone": "string",
    "authenticated": "true"
}

Response:
{
    "status": "success",
    "message": "Phone number updated successfully",
    "phone": "string"
}
```

### Password Recovery

#### Request Password Reset
```http
POST /api/auth/password/request-reset
Content-Type: application/json

Request Body:
{
    "email": "string"
}

Response:
{
    "status": "success",
    "message": "Recovery code sent to your email"
}
```

#### Verify OTP and Reset Password
```http
POST /api/auth/password/verify-reset
Content-Type: application/json

Request Body:
{
    "email": "string",
    "otp": "string",
    "newPassword": "string"
}

Response:
{
    "status": "success",
    "message": "Password reset successfully"
}
```

## Email Service

The email service handles automatic email notifications for user operations.

### Email Configuration

Configuration in application.properties:
```properties
# Email Configuration
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=email@gmail.com
spring.mail.password=app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# Email Service Toggle
email.service.enabled=true
```


## Admin API

### User Management

#### Get All Users
```http
GET /api/admin/users
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

#### Get User Details
```http
GET /api/admin/user/{userId}
Headers:
  Admin-Username: string
  Authentication-Status: "true"

Response:
{
    "status": "success",
    "data": {
        "userId": number,
        "username": "string",
        "email": "string",
        "phone": "string",
        "role": "string",
        "firstName": "string",
        "lastName": "string",
        "createdAt": "string (date-time)",
        "lastLogin": "string (date-time)"
    }
}
```

#### Create User
```http
POST /api/admin/user/create
Content-Type: application/json
Headers:
  Admin-Username: string
  Authentication-Status: "true"

Request Body:
{
    "adminUsername": "string",
    "authenticated": "true",
    "username": "string",
    "email": "string" (required for VOLUNTEER role),
    "phone": "string" (optional),
    "firstName": "string" (optional),
    "lastName": "string" (optional),
    "role": "CLIENT" or "VOLUNTEER"
}

Response:
{
    "status": "success",
    "message": "User created successfully",
    "userId": number,
    "username": "string",
    "role": "string",
    "generatedPassword": "string"
}
```

*Note: When a user is created with an email address, an email with login credentials is automatically sent to the user.*

#### Update User Information
```http
PUT /api/admin/user/update/{userId}
Content-Type: application/json
Headers:
  Admin-Username: string
  Authentication-Status: "true"

Request Body:
{
    "adminUsername": "string",
    "authenticated": "true",
    "username": "string" (optional),
    "email": "string" (optional),
    "phone": "string" (optional),
    "role": "string" (optional),
    "firstName": "string" (optional),
    "lastName": "string" (optional)
}

Response:
{
    "status": "success",
    "message": "User updated successfully",
    "userId": number,
    "currentUsername": "string",
    "updatedFields": {
        "field1": "value1",
        "field2": "value2"
    }
}
```

#### Delete User
```http
DELETE /api/admin/user/delete
Content-Type: application/json
Headers:
  Admin-Username: string
  Authentication-Status: "true"

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

### Password Operations

#### Reset User Password
```http
POST /api/admin/user/reset-password/{userId}
Content-Type: application/json
Headers:
  Admin-Username: string
  Authentication-Status: "true"

Request Body:
{
    "adminUsername": "string",
    "authenticated": "true",
    "newPassword": "string"
}

Response:
{
    "status": "success",
    "message": "Password reset successfully",
    "userId": number,
    "username": "string"
}
```

#### Migrate All Passwords to Hashed Format
```http
POST /api/admin/migrate-passwords
Headers:
  Admin-Username: string
  Authentication-Status: "true"

Response:
{
    "status": "success",
    "message": "All passwords have been migrated to hashed format"
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

Error Response (if items are out of stock):
{
    "status": "error",
    "message": "Insufficient quantity available for: ItemName",
    "authenticated": false
}
```

*Note: Creating an order now verifies available inventory and temporarily reserves the requested quantities.*

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

*Note: Guest orders have the same inventory reservation behavior as authenticated orders.*

### View Orders

#### Get All Orders (Volunteer Only)
```http
GET /api/orders/all
Query Parameters:
  authenticated: boolean
  userId: number
  userRole: string

Response:
{
    "status": "success",
    "orders": [
        {
            "orderId": number,
            "userId": number,
            "status": "string",
            "deliveryAddress": "string",
            "notes": "string",
            "requestTime": "string (date-time)",
            "orderItems": [
                {
                    "itemName": "string",
                    "quantity": number
                }
            ]
        }
    ],
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
    "orders": [
        {
            "orderId": number,
            "status": "string",
            "deliveryAddress": "string",
            "notes": "string",
            "requestTime": "string (date-time)",
            "orderItems": [
                {
                    "itemName": "string",
                    "quantity": number
                }
            ]
        }
    ],
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

*Note: When an order status is changed to COMPLETED, the reserved inventory becomes permanently deducted. When changed to CANCELLED, reserved inventory is released back into stock.*

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

*Note: Cancelling an order releases any reserved inventory items back into stock, unless the order was already in COMPLETED status.*

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

## Feedback API

### Submit Feedback
```http
POST /api/feedback/submit
Content-Type: application/json

Request Body:
{
    "name": "string",
    "phoneNumber": "string" (optional),
    "content": "string"
}

Response:
{
    "status": "success",
    "message": "Feedback submitted successfully",
    "feedbackId": number
}
```

### Get All Feedback
```http
GET /api/feedback/all
Headers:
  Admin-Username: string
  Authentication-Status: "true"

Response:
{
    "status": "success",
    "data": [
        {
            "id": number,
            "name": "string",
            "phoneNumber": "string",
            "content": "string",
            "createdAt": "string (date-time)"
        }
    ]
}
```

### Delete Feedback
```http
DELETE /api/feedback/{id}
Headers:
  Admin-Username: string
  Authentication-Status: "true"

Response:
{
    "status": "success",
    "message": "Feedback deleted successfully"
}
```

### Search Feedback
```http
GET /api/feedback/search?name={name}
Headers:
  Admin-Username: string
  Authentication-Status: "true"

Response:
{
    "status": "success",
    "data": [
        {
            "id": number,
            "name": "string",
            "phoneNumber": "string",
            "content": "string",
            "createdAt": "string (date-time)"
        }
    ]
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

*Note: When a volunteer application is approved, an email is automatically sent to the volunteer with their login credentials.*

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
   - Users can update their username, email, phone, and password
   - Password changes require current password verification
   - Email changes require current password verification
   - All updates check for conflicts with existing users

4. **Admin Access**
   - Separated into dedicated AdminController
   - Protected admin endpoints with role verification
   - User management capabilities (create, update, delete)
   - Password reset functionality with specified password
   - System-wide operations (e.g., password migration)

### Password Recovery Flow
1. **Password Reset Request**
   - User requests password reset by providing email
   - System generates a 6-digit OTP code
   - OTP is stored in memory with 15-minute expiration
   - System sends OTP to user's email address

2. **OTP Verification and Password Reset**
   - User submits OTP code and new password
   - System verifies OTP code validity and expiration
   - If valid, password is updated and OTP is removed
   - If invalid or expired, error is returned

### Email Notification System
1. **System Components**
   - Configuration in `application.properties`
   - Email service enabled/disabled toggle
   - Asynchronous email sending via dedicated thread pool
   - Admin control endpoints

2. **Email Types**
   - Password recovery emails with OTP
   - New user account creation notification with credentials
   - Volunteer application approval notification with login info

3. **Performance Considerations**
   - Non-blocking asynchronous processing
   - Dedicated thread pool for email operations
   - Connection timeouts to prevent hanging operations
   - Reduced debug logging in production

### Order Flow
1. **Order Creation**
   - Supports both authenticated and guest orders
   - Requires delivery address and at least one item
   - Validates inventory availability for all requested items
   - Reserves inventory items by reducing their quantities temporarily
   - Initial status: PENDING

2. **Order Management**
   - Client Permissions:
     - Create orders
     - View own orders
     - Cancel own orders (releases reserved inventory)
   - Volunteer Permissions:
     - View all orders
     - Update order status (affects inventory)
     - Process orders
   - Guest Orders:
     - Basic order creation with inventory validation
     - No authentication required
     - Limited tracking capabilities

3. **Order Status Lifecycle**
```
                   [inventory reserved]
                           |
[Created] --------> PENDING --------> PROCESSING --------> COMPLETED
                      |                   |                 [inventory
                      |                   |              reduction permanent]
                      |                   |
                      +------------------+
                              |
                              v
                         CANCELLED
                    [inventory released]
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
   - **Inventory Reservation**: Temporary reduction for pending orders
   - **Inventory Release**: Restoring quantities when orders are cancelled

3. **Image Management**
   - Upload images for items
   - Store images in MongoDB
   - Retrieve images by ID
   - Delete images when no longer needed

### Order-Inventory Integration

1. **Inventory Reservation System**
   - When an order is created, inventory is immediately reserved
   - Items are checked for availability before reservation
   - Prevents overselling of inventory items
   - Aggregates quantities for duplicate items in the same order

2. **Status-Based Inventory Management**
   - **PENDING**: Inventory is reserved but can be released
   - **PROCESSING**: Inventory remains reserved
   - **COMPLETED**: Inventory deduction becomes permanent
   - **CANCELLED**: Reserved inventory is returned to stock

3. **Inventory Validation**
   - Checks if sufficient quantities are available before order creation
   - Validates that inventory items exist by name
   - Prevents orders for out-of-stock items

4. **Inventory Update Workflow**
   - `reserveItems()`: Temporarily reduces inventory for new orders
   - `updateQuantity()`: Updates inventory quantities with validation
   - `releaseReservedInventory()`: Restores quantities for cancelled orders
   - Low stock threshold monitoring during quantity changes

5. **Transaction Management**
   - All inventory operations are transactional
   - Prevents partial order processing
   - Ensures inventory consistency
   - Rollbacks on errors during order processing

### Feedback Management
1. **Feedback Submission**
   - Open to all users without login requirement
   - Required fields: name and content
   - Optional phone number for contact

2. **Feedback Administration**
   - Admin-only access to feedback management
   - View all feedback submissions
   - Search feedback by name
   - Delete feedback entries

3. **Data Collection**
   - Timestamp tracking for all feedback
   - Organization by submission time
   - Search functionality for analysis

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
   - Initial password provision with email notification
   - Role assignment

### Access Control
1. **Authentication Requirements**
   - Most endpoints require authentication
   - Guest services for limited operations
   - Admin operations require additional header verification

2. **Role-Based Access**
   - CLIENT: Self-service operations
   - VOLUNTEER: Extended order management
   - ADMIN: Full system access including cargo management
   - GUEST: Limited order creation

3. **Security Measures**
   - Password hashing
   - Current password verification for sensitive changes
   - One-time password (OTP) for password recovery
   - Input validation
   - CORS protection