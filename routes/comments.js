// Comments on posts. Mounted at /api.
const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const ONE = `SELECT c.id, c.body, c.created_at, c.user_id, u.username AS author
  FROM comments c JOIN users u ON u.id = c.user_id`;

router.get('/posts/:id/comments', (req, res) => {
  res.json(db.prepare(`${ONE} WHERE c.post_id = ? ORDER BY c.created_at ASC, c.id ASC`).all(req.params.id));
});

router.post('/posts/:id/comments', requireAuth, (req, res) => {
  const body = (req.body.body || '').trim();
  if (!body) return res.status(400).json({ error: 'Write something before posting.' });
  if (body.length > 1000) return res.status(400).json({ error: 'Comments are limited to 1000 characters.' });
  if (!db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.id))
    return res.status(404).json({ error: 'This post does not exist.' });
  const info = db.prepare('INSERT INTO comments (post_id, user_id, body) VALUES (?, ?, ?)')
    .run(req.params.id, req.user.id, body);
  res.status(201).json(db.prepare(`${ONE} WHERE c.id = ?`).get(info.lastInsertRowid));
});

// A comment can be removed by its author or by the owner of the post.
router.delete('/comments/:id', requireAuth, (req, res) => {
  const c = db.prepare(`SELECT c.*, p.user_id AS post_owner FROM comments c
    JOIN posts p ON p.id = c.post_id WHERE c.id = ?`).get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Comment not found.' });
  if (c.user_id !== req.user.id && c.post_owner !== req.user.id)
    return res.status(403).json({ error: 'You cannot delete this comment.' });
  db.prepare('DELETE FROM comments WHERE id = ?').run(c.id);
  res.json({ ok: true });
});

module.exports = router;
