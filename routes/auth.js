// User registration, login and session check.
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { sign, requireAuth } = require('../middleware/auth');

router.post('/register', (req, res) => {
  const { username = '', email = '', password = '' } = req.body;
  if (username.trim().length < 3) return res.status(400).json({ error: 'Username needs at least 3 characters.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password needs at least 6 characters.' });

  const exists = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?')
    .get(username.trim(), email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'That username or email is already registered.' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
    .run(username.trim(), email.toLowerCase(), hash);
  const user = { id: Number(info.lastInsertRowid), username: username.trim() };
  res.status(201).json({ token: sign(user), user });
});

router.post('/login', (req, res) => {
  const { email = '', password = '' } = req.body;
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!row || !bcrypt.compareSync(password, row.password_hash))
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  const user = { id: row.id, username: row.username };
  res.json({ token: sign(user), user });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

module.exports = router;
