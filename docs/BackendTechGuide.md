### Technology Stack
- Spring Boot 3.x
- Java 17
- PostgreSQL
- JPA/Hibernate
- Maven

### Project Structure
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
│   └── UserMetadataRepository.java
└── service/
    ├── UserService.java
    └── OrderService.java
```

## API Documentation

### Authentication Endpoints

#### Register New User
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

#### User Login
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
    "authenticated": boolean,
    "username": string,
    "email": string
}
```

### Admin Endpoints

#### Get All Users
```http
GET /api/auth/users
Headers:
- Admin-Username: string
- Authentication-Status: true

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
    "adminUsername": "string",
    "username": "string",
    "authenticated": "true"
}

Response:
{
    "status": "success",
    "message": "User deleted successfully",
    "authenticated": true
}
```

## Authentication Flow

1. **Registration**:
   - Users can only register as CLIENT role
   - System automatically creates user metadata
   - Passwords are stored securely (TODO: implement encryption)

2. **Login**:
   - Validates credentials
   - Updates last login timestamp
   - Returns authentication status and user role
   - Sets authenticated status for subsequent requests

3. **Admin Access**:
   - Requires valid admin credentials
   - Requires authenticated status
   - Provides access to user management features