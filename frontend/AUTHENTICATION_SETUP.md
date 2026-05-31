# Frontend Authentication Setup

## Quick Start

```bash
npm install
npm start  # Port 3000
```

## Files Created

- `src/components/auth/Login.js` - Login page
- `src/components/auth/Register.js` - Register page
- `src/components/auth/Auth.css` - Styles
- `src/components/UserMenu.js` - User dropdown
- `src/components/ProtectedRoute.js` - Route guard
- `src/contexts/AuthContext.js` - Auth state

## Features

- Login/Register with validation
- Password strength indicator
- Show/hide password
- Remember me
- Auto token refresh
- Protected routes
- User dropdown menu

## Usage

**Use Auth in Components:**
```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  // ...
}
```

**Protected Routes:**
```javascript
<Route path="/profile" element={
  <ProtectedRoute>
    <ProfilePage />
  </ProtectedRoute>
} />
```

**API Calls with Token:**
```javascript
const { getAccessToken } = useAuth();
const token = await getAccessToken();

fetch(url, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## Config (.env)

```env
REACT_APP_IAM_URL=http://localhost:3001
```

## Validation Rules

**Username:** 3-30 chars, alphanumeric + _ -

**Password:** 8+ chars, must have letter + number
