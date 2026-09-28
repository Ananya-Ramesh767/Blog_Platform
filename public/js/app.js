/* Single-page frontend: hash routing, no build step needed. */
const app = document.getElementById('app');
const state = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
};

/* ---------- helpers ---------- */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const parseDate = (d) => new Date(d.replace(' ', 'T') + 'Z');
const fmtDate = (d) => parseDate(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
function ago(d) {
  const s = (Date.now() - parseDate(d)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + ' h ago';
  if (s < 604800) return Math.floor(s / 86400) + ' d ago';
  return fmtDate(d);
}
const readTime = (t) => Math.max(1, Math.round(t.trim().split(/\s+/).length / 200)) + ' min read';
const avatar = (name) => {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `<span class="avatar" style="background:hsl(${h} 50% 42%)">${esc(name[0].toUpperCase())}</span>`;
};

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(state.token && { Authorization: 'Bearer ' + state.token }) },
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && state.token) logout(true);

    if (data.errors) {
      const messages = Object.values(data.errors);
      throw new Error(messages.join('\n'));
    }

    throw new Error(data.error || 'Something went wrong.');
  }
  return data;
}

function toast(msg, err = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (err ? ' err' : '');
  el.textContent = msg;
  document.getElementById('toasts').append(el);
  setTimeout(() => el.remove(), 3200);
}

function setAuth(token, user) {
  state.token = token; state.user = user;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}
function logout(expired) {
  state.token = null; state.user = null;
  localStorage.removeItem('token'); localStorage.removeItem('user');
  if (expired) toast('Your session expired. Please log in again.', true);
  location.hash = '#/login';
  route();
}

/* ---------- nav ---------- */
function renderNav() {
  document.getElementById('nav').innerHTML = `
    <a class="brand" href="#/">Ink<span>spire</span></a>
    <div class="nav-right">
      ${state.user
        ? `<span class="hello">Hi, ${esc(state.user.username)}</span>
           <a class="btn btn-primary btn-sm" href="#/write">Write a post</a>
           <button class="btn btn-ghost btn-sm" id="logout">Log out</button>`
        : `<a class="btn btn-ghost btn-sm" href="#/login">Log in</a>
           <a class="btn btn-primary btn-sm" href="#/register">Sign up</a>`}
    </div>`;
  const lo = document.getElementById('logout');
  if (lo) lo.onclick = () => { logout(); toast('You are logged out.'); };
}

/* ---------- views ---------- */
async function homeView() {
  app.innerHTML = `
    <section class="hero">
      <h1>Read, write and talk it through.</h1>
      <p>Posts from our community, and the conversations they start.</p>
      <div class="hero-cta">
        <a class="btn btn-primary" href="#/write">Start writing</a>
        <button class="btn btn-ghost" id="browse">Browse posts</button>
      </div>
      <div class="search"><input id="q" type="search" placeholder="Search posts by title or keyword" aria-label="Search posts"></div>
    </section>
    <div id="list" class="grid"></div>`;
  let timer;
  async function load(q = '') {
    const list = document.getElementById('list');
    try {
      const posts = await api('/posts?q=' + encodeURIComponent(q));
      if (!posts.length) {
        list.className = '';
        list.innerHTML = `<div class="empty"><h3>${q ? 'No posts match your search' : 'No posts yet'}</h3>
          <p>${q ? 'Try a different keyword.' : 'Be the first to publish something.'}</p>
          ${!q ? '<a class="btn btn-primary" href="#/write">Write the first post</a>' : ''}</div>`;
        return;
      }
      list.className = 'grid';
      list.innerHTML = posts.map((p, i) => `
        <a class="card ${i === 0 && !q ? 'feature' : ''}" href="#/post/${p.id}">
          <div class="meta">${avatar(p.author)}<span>${esc(p.author)}</span><i class="sep"></i><span>${fmtDate(p.created_at)}</span></div>
          <h2>${esc(p.title)}</h2>
          <p class="ex">${esc(p.content)}</p>
          <div class="meta foot"><span>${readTime(p.content)}</span><i class="sep"></i><span>${p.comment_count} comment${p.comment_count === 1 ? '' : 's'}</span></div>
        </a>`).join('');
    } catch (e) { toast(e.message, true); }
  }
  document.getElementById('q').oninput = (e) => { clearTimeout(timer); timer = setTimeout(() => load(e.target.value), 250); };
  document.getElementById('browse').onclick = () => document.getElementById('list').scrollIntoView({ behavior: 'smooth' });
  load();
}

async function postView(id) {
  let post;
  try { post = await api('/posts/' + id); }
  catch (e) { app.innerHTML = `<div class="empty"><h3>Post not found</h3><p>${esc(e.message)}</p><a class="btn btn-primary" href="#/">Back to all posts</a></div>`; return; }
  const mine = state.user && state.user.id === post.user_id;
  const edited = post.updated_at !== post.created_at ? ' (edited)' : '';
  app.innerHTML = `
    <article class="article">
      <a class="back" href="#/">← All posts</a>
      <h1>${esc(post.title)}</h1>
      <div class="meta">${avatar(post.author)}<span>${esc(post.author)}</span><i class="sep"></i><span>${fmtDate(post.created_at)}${edited}</span><i class="sep"></i><span>${readTime(post.content)}</span></div>
      ${mine ? `<div class="actions"><a class="btn btn-ghost btn-sm" href="#/edit/${post.id}">Edit post</a><button class="btn btn-danger btn-sm" id="del-post">Delete post</button></div>` : ''}
      <div class="body"><p>${esc(post.content)}</p></div>
      <section class="comments" aria-label="Comments">
        <h3 id="ccount">Comments</h3>
        <div id="cbox"></div>
        <div id="clist"></div>
      </section>
    </article>`;

  if (mine) document.getElementById('del-post').onclick = async () => {
    if (!confirm('Delete this post and all its comments?')) return;
    try { await api('/posts/' + id, { method: 'DELETE' }); toast('Post deleted.'); location.hash = '#/'; }
    catch (e) { toast(e.message, true); }
  };

  document.getElementById('cbox').innerHTML = state.user
    ? `<div class="cform"><textarea id="cbody" maxlength="1000" placeholder="Add to the discussion" aria-label="Your comment"></textarea>
       <button class="btn btn-primary" id="cpost" style="align-self:flex-start">Post comment</button></div>`
    : `<div class="login-cta"><a href="#/login">Log in</a> or <a href="#/register">sign up</a> to join the conversation.</div>`;

  async function loadComments() {
    const comments = await api(`/posts/${id}/comments`);
    document.getElementById('ccount').textContent = `${comments.length} comment${comments.length === 1 ? '' : 's'}`;
    document.getElementById('clist').innerHTML = comments.length
      ? comments.map((c) => `
        <div class="comment">${avatar(c.author)}
          <div class="txt"><span class="who">${esc(c.author)}</span><span class="when">${ago(c.created_at)}</span><p>${esc(c.body)}</p></div>
          ${state.user && (state.user.id === c.user_id || mine) ? `<button class="del" data-id="${c.id}">Delete</button>` : ''}
        </div>`).join('')
      : '<p style="color:var(--muted);padding:12px 0">No comments yet. Start the conversation.</p>';
    document.querySelectorAll('.del').forEach((b) => b.onclick = async () => {
      try { await api('/comments/' + b.dataset.id, { method: 'DELETE' }); toast('Comment deleted.'); loadComments(); }
      catch (e) { toast(e.message, true); }
    });
  }

  const cp = document.getElementById('cpost');
  if (cp) cp.onclick = async () => {
    const ta = document.getElementById('cbody');
    cp.disabled = true;
    try { await api(`/posts/${id}/comments`, { method: 'POST', body: { body: ta.value } }); ta.value = ''; toast('Comment posted.'); await loadComments(); }
    catch (e) { toast(e.message, true); }
    cp.disabled = false;
  };
  loadComments();
}

async function editorView(id) {
  if (!state.user) { location.hash = '#/login'; return; }
  let post = { title: '', content: '' };
  if (id) {
    try { post = await api('/posts/' + id); } catch (e) { toast(e.message, true); location.hash = '#/'; return; }
    if (post.user_id !== state.user.id) { toast('You can only edit your own posts.', true); location.hash = '#/'; return; }
  }
  app.innerHTML = `
    <form class="panel wide" id="pform" novalidate>
      <h1>${id ? 'Edit post' : 'Write a post'}</h1>
      <p class="sub">${id ? 'Update your story and save the changes.' : 'Share something worth reading.'}</p>
      <label for="title">Title</label><input id="title" maxlength="300" value="${esc(post.title)}">
      <label for="content">Story</label><textarea id="content" class="big">${esc(post.content)}</textarea>
      <div id="err"></div>
      <div class="row"><a class="btn btn-ghost" href="${id ? '#/post/' + id : '#/'}">Cancel</a>
      <button class="btn btn-primary">${id ? 'Save changes' : 'Publish post'}</button></div>
    </form>`;
  document.getElementById('pform').onsubmit = async (e) => {
    e.preventDefault();
    const body = { title: document.getElementById('title').value, content: document.getElementById('content').value };
    try {
      const saved = await api(id ? '/posts/' + id : '/posts', { method: id ? 'PUT' : 'POST', body });
      toast(id ? 'Changes saved.' : 'Post published.');
      location.hash = '#/post/' + saved.id;
    } catch (err) {
      document.getElementById('err').innerHTML =
        `<div class="error">${esc(err.message).replace(/\n/g, '<br>')}</div>`;
    }
  };
}

function authView(mode) {
  if (state.user) { location.hash = '#/'; return; }
  const reg = mode === 'register';
  app.innerHTML = `
    <form class="panel" id="aform" novalidate>
      <h1>${reg ? 'Create your account' : 'Welcome back'}</h1>
      <p class="sub">${reg ? 'Join to publish posts and comment.' : 'Log in to write and comment.'}</p>
      ${reg ? '<label for="username">Username</label><input id="username" autocomplete="username">' : ''}
      <label for="email">Email</label><input id="email" type="email" autocomplete="email">
      <label for="password">Password</label><input id="password" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}">
      <div id="err"></div>
      <button class="btn btn-primary">${reg ? 'Create account' : 'Log in'}</button>
      <p class="swap">${reg ? 'Already have an account? <a href="#/login">Log in</a>' : 'New here? <a href="#/register">Create an account</a>'}</p>
    </form>`;
  document.getElementById('aform').onsubmit = async (e) => {
    e.preventDefault();
    const val = (i) => document.getElementById(i).value;
    const body = { email: val('email'), password: val('password') };
    if (reg) body.username = val('username');
    try {
      const data = await api('/auth/' + mode, { method: 'POST', body });
      setAuth(data.token, data.user);
      toast(reg ? 'Account created. Welcome!' : 'Welcome back, ' + data.user.username + '.');
      location.hash = '#/';
    } catch (err) { document.getElementById('err').innerHTML = `<div class="error">${esc(err.message)}</div>`; }
  };
}

/* ---------- router ---------- */
function route() {
  renderNav();
  const [, page, id] = (location.hash || '#/').split('/');
  window.scrollTo(0, 0);
  if (!page) homeView();
  else if (page === 'post') postView(id);
  else if (page === 'write') editorView();
  else if (page === 'edit') editorView(id);
  else if (page === 'login' || page === 'register') authView(page);
  else homeView();
}
window.addEventListener('hashchange', route);
route();