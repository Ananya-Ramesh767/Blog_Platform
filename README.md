# Inkwell – Blog Platform with Comments

Full-stack blog: Node.js + Express REST API, SQLite database, vanilla JS frontend.

## Run
    npm install
    npm start
Open http://localhost:3000

## API
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | – | Create account |
| POST | /api/auth/login | – | Log in, returns JWT |
| GET | /api/auth/me | ✔ | Current user |
| GET | /api/posts?q= | – | List / search posts |
| GET | /api/posts/:id | – | Single post |
| POST | /api/posts | ✔ | Create post |
| PUT | /api/posts/:id | ✔ owner | Edit post |
| DELETE | /api/posts/:id | ✔ owner | Delete post |
| GET | /api/posts/:id/comments | – | List comments |
| POST | /api/posts/:id/comments | ✔ | Add comment |
| DELETE | /api/comments/:id | ✔ author/post owner | Delete comment |
