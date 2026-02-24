# EchoLog 🎙️

**Real-Time Speech Captioning and Event Logging Platform**

EchoLog is a full-stack web application that captures live speech, converts it into real-time captions, and logs them under specific events. It enables users to create events, view live captions, and access historical speech logs through an intuitive dashboard.

---

## 🚀 Features

### 🎤 Real-Time Speech Captioning

* Converts live speech into text instantly using speech recognition.
* Displays captions live for participants.
* Uses WebSockets for low-latency real-time updates.

### 📅 Event Management

* Create and manage speech events.
* Join or leave events dynamically.
* Store captions per event.

### 📊 Dashboard & History

* View past events and caption history.
* Track recording activity.
* Organized event-based logging system.

### ⚙️ User Settings

* Manage speech recognition settings.
* Customize caption behavior.

### 🔒 Secure Backend

* JWT authentication support.
* Rate limiting and security headers.
* MongoDB database integration.

---

## 🧱 Tech Stack

### Frontend

* React.js
* Material UI
* Socket.IO Client
* React Speech Recognition
* Axios

### Backend

* Node.js
* Express.js
* Socket.IO
* MongoDB (Mongoose)
* JWT Authentication

### Other Tools

* WebSockets for real-time communication
* REST API architecture

---

## 📂 Project Structure

```
EchoLog-main/
│
├── backend/
│   ├── server.js
│   ├── routes/
│   │   ├── events.js
│   │   ├── captions.js
│   │   └── users.js
│   ├── services/
│   │   └── speechService.js
│   ├── utils/
│   │   └── helpers.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   └── services/
│   └── package.json
│
└── README.md
```

---

## ⚙️ Installation and Setup

### 1️⃣ Clone the repository

```
git clone https://github.com/yourusername/EchoLog.git
cd EchoLog-main
```

---

### 2️⃣ Backend Setup

```
cd backend
npm install
```

Create `.env` file:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:3000
JWT_SECRET=your_secret_key
NODE_ENV=development
```

Run backend:

```
npm run dev
```

Backend runs on:

```
http://localhost:5000
```

---

### 3️⃣ Frontend Setup

Open new terminal:

```
cd frontend
npm install
npm start
```

Frontend runs on:

```
http://localhost:3000
```

---

## 🔌 API Endpoints Overview

### Health Check

```
GET /api/health
```

### Events

```
GET    /api/events
POST   /api/events
GET    /api/events/:id
DELETE /api/events/:id
```

### Captions

```
GET    /api/captions/:eventId
POST   /api/captions
```

### Users

```
POST /api/users/register
POST /api/users/login
```

---

## 🔄 WebSocket Events

### Client → Server

* `join_event`
* `leave_event`
* `new_caption`
* `recording_status`

### Server → Client

* `caption_received`
* `recording_status_update`

---

## 🧠 How It Works

1. User creates or joins an event.
2. Speech recognition captures audio.
3. Captions are generated in real time.
4. Captions are sent via WebSocket.
5. Backend stores captions in MongoDB.
6. Other users in the event receive captions instantly.

---

## 🛡️ Security Features

* Helmet.js protection
* Rate limiting
* JWT authentication
* CORS protection

---

## 🧪 Testing

Backend:

```
npm test
```

Frontend:

```
npm test
```

---

## 📦 Build for Production

Frontend:

```
npm run build
```

Backend:

```
npm start
```

---

## 🌟 Future Improvements

* Speaker identification
* Export captions as PDF/CSV
* Real-time translation
* Role-based access control
* Cloud deployment support

---

## 👨‍💻 Author

Developed as a real-time speech logging and captioning platform.

---

## 📄 License

This project is licensed under the ISC License.

---

## 💡 Summary

EchoLog enables real-time speech-to-text captioning with event-based logging, using a scalable WebSocket architecture and modern full-stack technologies.

---
