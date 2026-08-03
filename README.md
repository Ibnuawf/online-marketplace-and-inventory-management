# Production-Quality Online Marketplace & Inventory Management

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

A robust, full-stack Online Marketplace and Business Inventory Management application designed with strict separation of concerns, secure PostgreSQL pooling, dual authentication (custom JWT and Firebase Auth), and a complete companion Android Jetpack Compose app structure.

---

## ✨ Tech Highlights

- **Drizzle ORM + PostgreSQL**: type-safe schema, migrations via Drizzle Kit, and pooled `pg` connections.
- **Dual authentication**: custom JWT (bcrypt-hashed credentials) and Firebase Auth ID tokens verified through a single middleware, with automatic account linking.
- **Offline-first sync**: version-based conflict detection for the companion Android app.
- **Render deployment**: one-click deploy via `render.yaml` (build with Vite + esbuild, serve a single Node bundle).

---

## 🏗️ Backend System Architecture

The Node.js and Express backend is engineered with an enterprise-ready MVC (Model-View-Controller) structure, isolating routes, authentication filters, input validation layers, and database transactions:

```
src/
├── controllers/          # Coordinate request validation, service calls, and HTTP responses
├── db/                   # Database schemas (Drizzle), connection poolers (pg) and configurations
├── middleware/           # Security layers, token verifiers (JWT + Firebase SDK)
├── routes/               # URI endpoint definitions and middleware chaining
└── services/             # Core business processes, bcrypt hashing, and version control
```

---

## 🗄️ Database Schema Design

The tables are configured in PostgreSQL via Drizzle ORM to maintain strict relationships, secure audit fields, and prepare for subsequent phase sync updates.

### 1. `users` Table
Stores registered credentials and maps to external logins:
- `id`: `serial` (Primary Key)
- `uid`: `text` (Unique, Nullable - stores Firebase Google Auth UID for dual-authentications)
- `name`: `text` (Not Null)
- `email`: `text` (Unique, Not Null)
- `password_hash`: `text` (Nullable - supports secure bcrypt digests for email credentials)
- `profile_image`: `text` (Nullable)
- `created_at`: `timestamp` (Default Now)
- `updated_at`: `timestamp` (Default Now)

### 2. `products` Table
Tracks market listings and stock levels:
- `id`: `serial` (Primary Key)
- `name`: `text` (Not Null)
- `description`: `text` (Not Null)
- `price`: `double precision` (Not Null)
- `quantity`: `integer` (Not Null)
- `image_url`: `text` (Nullable)
- `created_by`: `integer` (Foreign Key -> `users.id`, Cascades on Delete)
- `created_at`: `timestamp` (Default Now)
- `updated_at`: `timestamp` (Default Now)
- `version`: `integer` (Default 1, increments by +1 on every single update)

---

## 📡 REST API Documentation

All routes (except `/register` and `/login`) require a valid Bearer Token (`Authorization: Bearer <token>`) issued by the server or Firebase Auth.

### 🔑 Authentication

#### 1. Register User
- **Endpoint**: `POST /api/auth/register`
- **Payload**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@company.com",
    "password": "secure_password"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "user": {
      "id": 1,
      "uid": null,
      "name": "Jane Doe",
      "email": "jane@company.com",
      "profileImage": null,
      "createdAt": "2026-07-11T13:00:00.000Z",
      "updatedAt": "2026-07-11T13:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR..."
  }
  ```

#### 2. Login User
- **Endpoint**: `POST /api/auth/login`
- **Payload**:
  ```json
  {
    "email": "jane@company.com",
    "password": "secure_password"
  }
  ```
- **Response** (200 OK): Identical to Registration Response.

#### 3. Fetch User Profile
- **Endpoint**: `GET /api/users/profile` (Mapped to `/api/auth/profile` in routing)
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200 OK):
  ```json
  {
    "id": 1,
    "uid": null,
    "name": "Jane Doe",
    "email": "jane@company.com",
    "profileImage": null,
    "createdAt": "2026-07-11T13:00:00.000Z",
    "updatedAt": "2026-07-11T13:00:00.000Z"
  }
  ```

#### 4. Update Profile
- **Endpoint**: `PUT /api/users/profile` (Mapped to `/api/auth/profile` in routing)
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "name": "Jane Smith",
    "profile_image": "https://example.com/avatar.png"
  }
  ```
- **Response** (200 OK): Returns updated user object.

---

### 📦 Products & Inventory Management

#### 1. Create Product
- **Endpoint**: `POST /api/products`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "name": "Ultralight Laptop",
    "description": "High-speed business computer.",
    "price": 1499.99,
    "quantity": 25,
    "image_url": "https://example.com/laptop.png"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "id": 12,
    "name": "Ultralight Laptop",
    "description": "High-speed business computer.",
    "price": 1499.99,
    "quantity": 25,
    "imageUrl": "https://example.com/laptop.png",
    "createdBy": 1,
    "createdAt": "2026-07-11T13:10:00.000Z",
    "updatedAt": "2026-07-11T13:10:00.000Z",
    "version": 1
  }
  ```

#### 2. Get All Products (With Search, Sort & Pagination)
- **Endpoint**: `GET /api/products`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page`: `number` (Default: 1)
  - `limit`: `number` (Default: 10)
  - `search`: `string` (Searches by product name)
  - `sortBy`: `createdAt` | `price` | `name` | `quantity` (Default: `createdAt`)
  - `sortOrder`: `asc` | `desc` (Default: `desc`)
- **Response** (200 OK):
  ```json
  {
    "products": [
      {
        "id": 12,
        "name": "Ultralight Laptop",
        "description": "High-speed business computer.",
        "price": 1499.99,
        "quantity": 25,
        "imageUrl": "https://example.com/laptop.png",
        "createdBy": 1,
        "createdAt": "2026-07-11T13:10:00.000Z",
        "updatedAt": "2026-07-11T13:10:00.000Z",
        "version": 1,
        "creatorName": "Jane Smith"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 1,
      "totalPages": 1
    }
  }
  ```

#### 3. Get Single Product
- **Endpoint**: `GET /api/products/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200 OK): Returns single product DTO.

#### 4. Update Product (Auto-Increments Version Sequence)
- **Endpoint**: `PUT /api/products/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "name": "Ultralight Laptop v2",
    "price": 1549.99,
    "quantity": 20
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "id": 12,
    "name": "Ultralight Laptop v2",
    "description": "High-speed business computer.",
    "price": 1549.99,
    "quantity": 20,
    "imageUrl": "https://example.com/laptop.png",
    "createdBy": 1,
    "createdAt": "2026-07-11T13:10:00.000Z",
    "updatedAt": "2026-07-11T13:12:00.000Z",
    "version": 2
  }
  ```

#### 5. Delete Product
- **Endpoint**: `DELETE /api/products/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Product deleted successfully."
  }
  ```

---

## 🚀 Setting Up & Deploying Backend

### Environment Prerequisites
Ensure that PostgreSQL is installed and running, or utilize your active Google Cloud SQL Developer instance. Configure the environment properties inside `.env` referencing `.env.example`.

Firebase client settings live in `firebase-applet-config.json`; use `firebase-applet-config.example.json` as the template and fill in your own Firebase project values.

### Commands
1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Apply Database Schemas (Drizzle Push)**:
   ```bash
   npm run build # compiles server and client
   # Or using drizzle-kit manually:
   npx drizzle-kit push
   ```
3. **Launch Server**:
   ```bash
   npm run dev
   ```

---

## 📱 Companion Android App Integration

The companion mobile application is fully structured inside `/android` using Material 3 Compose, MVVM Architecture, Retrofit, Coroutines, and StateFlow:

1. **MainActivity (`/android/MainActivity.kt`)**: NavHost coordinator managing navigation switches from splash, credentials login, sign up, to dashboard, details, and editing dialogs.
2. **ApiService (`/android/data/remote/ApiService.kt`)**: Implements type-safe Retrofit HTTP calls.
3. **Repository (`/android/data/repository/Repository.kt`)**: Encapsulates network operations, caches authenticated user profile states, and maps bearer tokens.
4. **InventoryViewModel (`/android/viewmodel/InventoryViewModel.kt`)**: Directs reactive UI-States (`ProductListState`, `AuthState`), implements paging, search inputs, and deletion dialogs.
5. **Jetpack Compose UI Screens (`/android/ui/`)**: Styled utilizing Material 3 components (`OutlinedTextField`, `FloatingActionButton`, `AlertDialog`, `DropdownMenu`).

### Building Mobile Source
1. Copy the contents of the `/android` directory into your Android Studio project under your package structure (e.g., `com.marketplace.inventory`).
2. Add the following dependencies to your `app/build.gradle`:
   ```gradle
   // Retrofit & JSON Converters
   implementation 'com.squareup.retrofit2:retrofit:2.9.0'
   implementation 'com.squareup.retrofit2:converter-gson:2.9.0'

   // Lifecycle & ViewModels
   implementation 'androidx.lifecycle:lifecycle-viewmodel-compose:2.6.1'

   // Navigation
   implementation 'androidx.navigation:navigation-compose:2.6.0'
   ```
3. Adjust the `baseUrl` in `/android/MainActivity.kt` to point to your live backend domain or server IP.

---

## 🧪 Testing Backend via `curl`

Verify endpoints and user restrictions from your terminal:

```bash
# 1. Register a new Seller
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Admin Seller", "email": "admin@store.com", "password": "securepassword"}'

# (Save the "token" returned in response)
export TOKEN="YOUR_JWT_TOKEN"

# 2. Add an Inventory Product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Super Coffee Maker", "description": "12-cup digital coffee machine", "price": 89.99, "quantity": 15}'

# 3. Query Marketplace with Search and Sort parameters
curl "http://localhost:3000/api/products?search=Coffee&sortBy=price&sortOrder=desc" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔄 Prepared for Future Offline synchronization (Phase 2)
The backend architecture is built offline-ready:
1. **Sequential version sequences (`version`)**: Every product update increments this integer. When a client reconnects, it sends its local modifications with their versions; the backend compares the values to detect and flag sync conflicts.
2. **Last modified tracks (`updated_at`)**: Facilitates high-efficiency timestamp-based sync queries rather than pulling entire tables.
