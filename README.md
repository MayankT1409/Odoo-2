# SkillSwap Platform

A full-stack skill exchange platform where users can offer and request skills for mutual learning. Includes admin features for moderation, analytics, and reporting.

---

## 📦 Project Structure

```
Odoo-2/
├── backend/      # Node.js/Express API
├── frontend/     # React + Vite client
├── README.md
```

---

## 🚀 Features

- User registration & login (JWT authentication)
- Profile management with skills offered/wanted
- Create, accept, reject, and monitor swap requests
- User ratings and reviews
- Admin dashboard with statistics and moderation tools
- Platform-wide messaging and notifications
- Advanced analytics and downloadable reports

---

## ⚙️ Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   - Edit `.env` with your MongoDB URI and JWT secret.

3. **Start the server:**
   ```bash
   npm run dev
   # or
   npm start
   ```

   The API runs at `http://localhost:5000/api`

---

## 💻 Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the frontend:**
   ```bash
   npm run dev
   ```

   The app runs at `http://localhost:5173`

---

## 🧪 Testing

- Backend:  
  ```bash
  cd backend
  node test-api.js
  ```
- Frontend:  
  Use browser or run unit tests if available.


---

## 👤 Demo Accounts

- **Admin:** `admin@skillswap.com` / `admin123`
- **User:** `demo@skillswap.com` / `demo123`

---

## 🛠️ Admin Features

- Ban/unban users
- Moderate skills and reviews
- Download reports (user activity, swaps, feedback)
- Broadcast platform-wide messages

---

## 🤝 Support

If you encounter issues:
- Check logs and error messages
- Verify `.env` configuration
- See API documentation for request formats

---

## License

MIT
