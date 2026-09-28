# Blog Platform with Comments

A full-stack blogging platform where users can register, log in, create and manage blog posts, and interact through comments — built to get hands-on experience with authentication, REST APIs, database integration, and content management.

## 🌐 Live Website
# Blog Platform with Comments

A full-stack blogging platform where users can register, log in, create posts, edit and delete posts, and interact through comments.

 **Live Website:** https://blog-platform-nvre.onrender.com
## 🛠️ Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Authentication: JWT
- Password Security: bcrypt
- Database: SQLite
- Environment Configuration: dotenv
- API: RESTful APIs

## ✨ Features

- User registration and login
- JWT-based user authentication
- Secure password hashing with bcrypt
- Create, edit, and delete blog posts
- View published blog posts
- Comment section for user interaction
- Post validation with title and content limits
- RESTful backend APIs
- SQLite database integration
- Protected routes for authenticated users
- Environment variables for sensitive configuration

## 📋 Task Requirements

The project was developed to satisfy the following requirements:

- User registration, login, and authentication
- Create, edit, and delete blog posts
- Comment section for user interaction
- Backend with RESTful APIs and database integration

## 📂 Project Structure

```text
blog-platform/
│
├── middleware/
│   └── auth.js
│
├── public/
│   ├── index.html
│   ├── styles.css
│   └── js/
│       └── app.js
│
├── routes/
│   ├── auth.js
│   ├── posts.js
│   └── comments.js
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── blog.db
