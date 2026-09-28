// Blog post CRUD. Only the author can edit or delete a post.
const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const SELECT = `
  SELECT p.*, u.username AS author,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
  FROM posts p JOIN users u ON u.id = p.user_id`;

router.get('/', (req, res) => {
  const q = `%${(req.query.q || '').trim()}%`;
  res.json(db.prepare(`${SELECT} WHERE p.title LIKE ? OR p.content LIKE ? ORDER BY p.created_at DESC, p.id DESC`).all(q, q));
});

router.get('/:id', (req, res) => {
  const post = db.prepare(`${SELECT} WHERE p.id = ?`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'This post does not exist.' });
  res.json(post);
});

function validate(body) {
  const title = (body.title || '').trim();
  const content = (body.content || '').trim();
  if (title.length < 3) return { error: 'Give your post a title (3+ characters).' };
  if (content.length < 10) return { error: 'Write at least a couple of sentences.' };
  return { title, content };
}

router.post('/', requireAuth, (req, res) => {
  const v = validate(req.body);
  if (v.error) return res.status(400).json(v);
  const info = db.prepare('INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)')
    .run(req.user.id, v.title, v.content);
  res.status(201).json(db.prepare(`${SELECT} WHERE p.id = ?`).get(info.lastInsertRowid));
});

router.put('/:id', requireAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'This post does not exist.' });
  if (post.user_id !== req.user.id) return res.status(403).json({ error: 'You can only edit your own posts.' });
  const v = validate(req.body);
  if (v.error) return res.status(400).json(v);
  db.prepare('UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(v.title, v.content, post.id);
  res.json(db.prepare(`${SELECT} WHERE p.id = ?`).get(post.id));
});

router.delete('/:id', requireAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'This post does not exist.' });
  if (post.user_id !== req.user.id) return res.status(403).json({ error: 'You can only delete your own posts.' });
  db.prepare('DELETE FROM posts WHERE id = ?').run(post.id);
  res.json({ ok: true });
});

module.exports = router;
