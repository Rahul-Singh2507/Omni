# Omni AI Chat

Omni AI Chat is a full-stack AI chat application with user authentication, optional email verification, protected chat history, and AI-generated replies stored in MongoDB.

This repository has two apps:

- `Frontend/` - React + Vite + Redux + Tailwind CSS
- `Backend/` - Express + MongoDB + JWT cookie auth + LangChain-based AI services

## What The Project Does

At a high level, the project does this:

1. A user registers with `username`, `email`, and `password`
2. The backend saves the user in MongoDB
3. If email verification is enabled, the backend sends a verification email
4. The user logs in
5. The backend creates an HTTP-only JWT cookie
6. The frontend loads the protected dashboard
7. The user starts a chat or opens an old chat
8. The backend stores user messages and AI replies in MongoDB
9. The dashboard shows chat history and message threads

## Main Features

- Register and login flow
- Optional email verification before login
- Protected dashboard route
- Persistent chat history per user
- AI-generated chat titles for new conversations
- AI-generated responses for chat messages
- Markdown rendering for AI messages
- Basic Socket.IO connection setup
- Request validation and basic rate limiting on backend routes

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Redux Toolkit
- Axios
- Tailwind CSS
- React Markdown
- Socket.IO client

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- Cookie-based sessions
- Nodemailer
- LangChain
- Google Gemini
- Mistral
- Tavily
- Express Validator

## Project Structure

```text
PERPLEXITY/
├─ Backend/
│  ├─ server.js
│  └─ src/
│     ├─ app.js
│     ├─ config/
│     ├─ controllers/
│     ├─ middleware/
│     ├─ models/
│     ├─ routes/
│     ├─ services/
│     ├─ sockets/
│     └─ validators/
├─ Frontend/
│  ├─ package.json
│  └─ src/
│     ├─ app/
│     └─ features/
└─ README.md
```

## Frontend Flow

### App startup

When the frontend starts, `Frontend/src/app/App.jsx` calls `handleGetMe()` from the auth hook. This checks whether the user already has a valid auth cookie and loads the current user into Redux.

### Routing

Defined in `Frontend/src/app/app.routes.jsx`:

- `/login` -> login page
- `/register` -> register page
- `/` -> protected dashboard
- `/dashboard` -> redirects to `/`

### Auth state

Redux auth state stores:

- `user`
- `loading`
- `error`

Main auth files:

- `Frontend/src/features/auth/auth.slice.js`
- `Frontend/src/features/auth/hook/useAuth.js`
- `Frontend/src/features/auth/services/auth.api.js`

### Dashboard state

Redux chat state stores:

- `chats`
- `currentChatId`
- `isLoading`
- `error`

Main chat files:

- `Frontend/src/features/chat/chat.slice.js`
- `Frontend/src/features/chat/hooks/useChat.js`
- `Frontend/src/features/chat/pages/Dashboard.jsx`
- `Frontend/src/features/chat/services/chat.api.js`

### Dashboard behavior

The dashboard:

- initializes a Socket.IO connection
- loads the user chat list
- opens an existing chat on click
- creates a new chat when the first message is sent without a `chatId`
- renders AI replies as Markdown

## Backend Flow

### Server startup

`Backend/server.js`:

- loads environment variables
- creates the HTTP server
- initializes Socket.IO
- connects to MongoDB
- starts Express

### Express app

`Backend/src/app.js`:

- sets security-related response headers
- parses JSON and URL-encoded request bodies
- parses cookies
- enables CORS for the configured frontend URL
- mounts auth and chat routes
- handles unexpected server errors with JSON responses

### Authentication flow

#### Register

Route:

- `POST /api/auth/register`

What happens:

1. Backend validates `username`, `email`, and `password`
2. Backend checks if the user already exists
3. Password is hashed with bcrypt in the Mongoose pre-save hook
4. User is created in MongoDB
5. If `EMAIL_VERIFICATION_REQUIRED=true`, a verification email is sent
6. If email sending fails, the user record is rolled back

Main files:

- `Backend/src/routes/auth.route.js`
- `Backend/src/controllers/auth.controller.js`
- `Backend/src/validators/auth.validator.js`
- `Backend/src/models/user.model.js`
- `Backend/src/services/mail.service.js`

#### Login

Route:

- `POST /api/auth/login`

What happens:

1. Backend finds the user by email
2. Password is compared with the hashed password
3. If email verification is required and the user is not verified, login is blocked
4. A JWT is created
5. JWT is stored in an HTTP-only cookie called `token`

#### Get current user

Route:

- `GET /api/auth/get-me`

What happens:

1. `authUser` middleware reads the `token` cookie
2. JWT is verified
3. User info is loaded from MongoDB
4. Frontend uses this to keep the user logged in across refreshes

### Chat flow

#### Send message

Route:

- `POST /api/chats/message`

What happens:

1. Request is authenticated
2. Request is rate-limited
3. Message input is validated
4. If `chatId` exists, backend loads that chat for the current user
5. If `chatId` does not exist, backend creates a new chat
6. Backend generates a chat title for new chats using Mistral
7. Backend builds the conversation context
8. Backend generates the AI reply using Gemini through LangChain
9. Backend stores both user and AI messages in MongoDB
10. Frontend updates Redux and displays the result

#### Get chat list

Route:

- `GET /api/chats`

Returns all chats for the current user, newest first.

#### Get messages for one chat

Route:

- `GET /api/chats/:chatId/messages`

Returns messages for the selected chat in chronological order.

#### Delete chat

Route:

- `DELETE /api/chats/delete/:chatId`

Deletes a chat only if it belongs to the current user, then deletes its messages.

Main files:

- `Backend/src/routes/chat.route.js`
- `Backend/src/controllers/chat.controller.js`
- `Backend/src/validators/chat.validator.js`
- `Backend/src/models/chat.model.js`
- `Backend/src/models/message.model.js`

## AI Layer

Main AI file:

- `Backend/src/services/ai.service.js`

Current behavior:

- New chat titles are generated with Mistral
- Chat responses are generated with Gemini
- LangChain wraps the model calls
- Tavily search is available as a tool for internet lookups

Related service:

- `Backend/src/services/internet.service.js`

## Data Models

### User

Fields:

- `username`
- `email`
- `password`
- `verified`
- timestamps

### Chat

Fields:

- `user`
- `title`
- timestamps

### Message

Fields:

- `chat`
- `content`
- `role` (`user` or `ai`)
- timestamps

## Security And Runtime Protections

Current backend protections include:

- password hashing with bcrypt
- JWT stored in HTTP-only cookie
- request body size limits
- basic security headers
- auth and chat rate limiting
- route validation with Express Validator
- ownership checks when opening and deleting chats
- safer handling of AI/provider failures

Current frontend protections include:

- protected route wrapper
- safer external link handling for rendered Markdown

## Environment Variables

The backend depends on these environment variables:

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_VERIFICATION_REQUIRED`
- `GEMINI_API_KEY`
- `MISTRAL_API_KEY`
- `TAVILY_API_KEY`

The frontend may use:

- `VITE_API_URL`
- `VITE_SOCKET_URL`

## How To Run

### Backend

From `Backend/`:

```powershell
npm install
npm run dev
```

### Frontend

From `Frontend/`:

```powershell
npm install
npm run dev
```

## Important Runtime Note

Frontend API config defaults to:

- `http://localhost:3000`

That means the backend should either:

- run on port `3000`

or the frontend should be given:

- `VITE_API_URL`
- `VITE_SOCKET_URL`

that point to the backend server.

## Current Limitations

- Socket.IO is initialized, but there is no real-time chat event flow yet. It currently only connects and logs.
- There is no logout route yet.
- There is no streaming AI response yet. Responses arrive after the backend completes the full model call.
- Chat deletion exists on backend, but there is no visible delete action in the current dashboard UI.
- The frontend still keeps chat messages in Redux memory and reloads them from the backend when needed.

## Key Files To Read First

If someone wants to understand the code quickly, start here:

- `Frontend/src/app/App.jsx`
- `Frontend/src/app/app.routes.jsx`
- `Frontend/src/features/auth/hook/useAuth.js`
- `Frontend/src/features/chat/hooks/useChat.js`
- `Frontend/src/features/chat/pages/Dashboard.jsx`
- `Backend/server.js`
- `Backend/src/app.js`
- `Backend/src/controllers/auth.controller.js`
- `Backend/src/controllers/chat.controller.js`
- `Backend/src/services/ai.service.js`

## End-To-End Summary

This project is essentially a cookie-authenticated AI chat product:

- users sign up and log in
- the frontend protects the dashboard
- chat history is stored per user
- new conversations get an AI-generated title
- each user message is sent to the backend
- the backend builds context and asks the AI model for a response
- both sides of the conversation are saved and shown in the dashboard

That is the core purpose of the project today.
