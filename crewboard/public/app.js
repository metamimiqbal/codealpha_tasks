const app = document.querySelector('#app');
const nav = document.querySelector('#nav');
const state = { user: null, projects: [], project: null, members: [], tasks: [], modalTask: null };
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const date = value => value ? new Date(value).toLocaleDateString() : '';
async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const result = await response.json().catch(() => ({ success: false, error: { message: 'Unexpected server response' } }));
  if (!response.ok) { if (response.status === 401 && !path.startsWith('/auth')) location.hash = '#login'; throw new Error(result.error?.message || 'Request failed'); }
  return result.data;
}
function notify(message) { const toast = document.querySelector('#toast'); toast.textContent = message; toast.className = 'toast'; setTimeout(() => { toast.textContent = ''; toast.className = ''; }, 2800); }
function showError(error, target = app) { let box = target.querySelector('.error'); if (!box) { box = document.createElement('div'); box.className = 'error'; target.prepend(box); } box.textContent = error.message; }
function renderNav() { nav.innerHTML = state.user ? `<a class="link" href="#">Projects</a><a class="link" href="#profile">${esc(state.user.name)}</a><button class="quiet" id="logout">Log out</button>` : `<a class="link" href="#login">Log in</a><a class="button" href="#register">Get started</a>`; document.querySelector('#logout')?.addEventListener('click', async () => { await api('/auth/logout', { method: 'POST' }); state.user = null; location.hash = '#login'; render(); }); }
async function route() {
  const hash = location.hash || '#';
  if (!state.user) { try { state.user = (await api('/auth/me')).user; } catch { state.user = null; } }
  renderNav();
  if (!state.user) return authPage(hash === '#register' ? 'register' : 'login');
  if (hash === '#profile') return profilePage();
  const match = hash.match(/^#project\/([^/]+)$/);
  if (match) return projectPage(match[1]);
  return projectsPage();
}
function authPage(mode) {
  app.innerHTML = `<section class="auth-wrap"><div class="panel"><div class="badge">A calmer way to work together</div><h1>${mode === 'login' ? 'Welcome back' : 'Create your workspace account'}</h1><p class="muted">${mode === 'login' ? 'Sign in to pick up where your team left off.' : 'Start organizing the work that moves your team forward.'}</p><form id="auth-form">${mode === 'register' ? '<label>Name</label><input name="name" required maxlength="80" autocomplete="name">' : ''}<label>Email</label><input name="email" type="email" required autocomplete="email"><label>Password</label><input name="password" type="password" required minlength="8" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}"><div class="form-actions"><button>${mode === 'login' ? 'Log in' : 'Create account'}</button></div></form><p class="muted">${mode === 'login' ? `New to CrewBoard? <a class="link" href="#register">Create an account</a>` : `Already have an account? <a class="link" href="#login">Log in</a>`}</p></div></section>`;
  app.querySelector('form').addEventListener('submit', async event => { event.preventDefault(); const button = event.currentTarget.querySelector('button'); button.disabled = true; button.textContent = 'Please wait…'; try { const payload = Object.fromEntries(new FormData(event.currentTarget)); await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(payload) }); state.user = (await api('/auth/me')).user; location.hash = '#'; await route(); } catch (e) { showError(e, app.querySelector('.panel')); button.disabled = false; button.textContent = mode === 'login' ? 'Log in' : 'Create account'; } });
}
async function projectsPage() {
  app.innerHTML = '<div class="loading">Loading projects…</div>';
  try { state.projects = (await api('/projects')).projects; } catch (e) { return showError(e); }
  app.innerHTML = `<div class="page-head"><div><h1>Your projects</h1><div class="muted">A shared space for your team’s next steps.</div></div><button id="new-project">＋ New project</button></div>${state.projects.length ? `<div class="grid">${state.projects.map(p => `<article class="card project-card" data-id="${p._id}"><div class="badge">${p.role === 'owner' ? 'Owner' : 'Member'}</div><h3>${esc(p.name)}</h3><p class="muted">${esc(p.description || 'No description yet.')}</p><span class="muted">Open board →</span></article>`).join('')}</div>` : '<div class="panel empty">No projects yet. Create one to get your board started.</div>'}`;
  app.querySelector('#new-project').onclick = () => projectForm();
  app.querySelectorAll('.project-card').forEach(card => card.onclick = () => { location.hash = `#project/${card.dataset.id}`; });
}
function projectForm() { modal(`<h2>New project</h2><form id="project-form"><label>Project name</label><input name="name" required maxlength="100"><label>Description</label><textarea name="description" maxlength="1000"></textarea><div class="toolbar"><span class="spacer"></span><button class="quiet" type="button" data-close>Cancel</button><button>Create project</button></div></form>`); document.querySelector('#project-form').onsubmit = async e => { e.preventDefault(); try { const p = await api('/projects', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) }); closeModal(); location.hash = `#project/${p.project._id}`; } catch (err) { showError(err, e.currentTarget.closest('.modal')); } }; }
async function projectPage(id) {
  app.innerHTML = '<div class="loading">Loading your board…</div>';
  try { const data = await api(`/projects/${id}`); state.project = data.project; state.members = data.members; state.tasks = data.tasks; } catch (e) { location.hash = '#'; return notify(e.message); }
  const p = state.project, isOwner = state.members.some(m => m.role === 'owner' && m.user?._id === state.user.id);
  app.innerHTML = `<div class="page-head"><div><a class="link" href="#">← All projects</a><h1>${esc(p.name)}</h1><div class="muted">${esc(p.description || '')}</div></div><div class="toolbar">${isOwner ? '<button class="quiet" id="members">Manage members</button><button class="danger" id="delete-project">Delete project</button>' : ''}<button id="new-task">＋ Add task</button></div></div><div class="toolbar"><span class="muted">${state.members.length} members</span></div><section class="board">${[['todo','To Do'],['in_progress','In Progress'],['done','Done']].map(([key,title]) => `<div class="column" data-status="${key}"><div class="column-head"><span>${title}</span><span class="badge">${state.tasks.filter(t => t.status === key).length}</span></div>${state.tasks.filter(t => t.status === key).map(taskCard).join('')}</div>`).join('')}</section>`;
  document.querySelector('#new-task').onclick = () => taskForm();
  document.querySelector('#members')?.addEventListener('click', memberManager);
  document.querySelector('#delete-project')?.addEventListener('click', deleteProject);
  app.querySelectorAll('.task').forEach(el => el.onclick = () => taskDetail(el.dataset.id));
  app.querySelectorAll('.task-title-row .task-action').forEach(control => control.addEventListener('click', event => event.stopPropagation()));
  app.querySelectorAll('[data-start-task]').forEach(button => button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await api(`/tasks/${button.dataset.startTask}`, { method: 'PUT', body: JSON.stringify({ status: 'in_progress' }) });
      await projectPage(state.project._id);
      notify('Task moved to In Progress');
    } catch (error) {
      button.disabled = false;
      notify(error.message);
    }
  }));
  app.querySelectorAll('[data-toggle-completion]').forEach(input => input.addEventListener('change', async event => {
    event.stopPropagation();
    input.disabled = true;
    const status = input.checked ? 'done' : 'in_progress';
    try {
      await api(`/tasks/${input.dataset.toggleCompletion}`, { method: 'PUT', body: JSON.stringify({ status }) });
      await projectPage(state.project._id);
      notify(status === 'done' ? 'Task moved to Done' : 'Task moved back to In Progress');
    } catch (error) {
      input.checked = !input.checked;
      input.disabled = false;
      notify(error.message);
    }
  }));
}
function taskCard(t) {
  let action;
  if (t.status === 'todo') action = `<button type="button" class="task-action start-task" data-start-task="${t._id}">Start task</button>`;
  else if (t.status === 'in_progress') action = `<label class="task-action done-toggle" title="Mark this task done"><input type="checkbox" aria-label="Mark ${esc(t.title)} as done" data-toggle-completion="${t._id}"><span>Mark done</span></label>`;
  else action = `<label class="task-action done-toggle is-done" title="Move this task back to In Progress"><input type="checkbox" checked aria-label="Undo completion for ${esc(t.title)}" data-toggle-completion="${t._id}"><span>Undo done</span></label>`;
  return `<article class="task" data-id="${t._id}"><div class="task-title-row"><h3>${esc(t.title)}</h3>${action}</div>${t.description ? `<p>${esc(t.description)}</p>` : ''}<div class="task-meta"><span class="badge ${esc(t.priority)}">${esc(t.priority)}</span><span>${esc(t.assignee?.name || 'Unassigned')}${t.dueDate ? ` · ${date(t.dueDate)}` : ''}</span></div></article>`;
}
function taskForm(task) {
  const editing = !!task; const members = state.members.map(m => `<option value="${m.user._id}" ${task?.assignee?._id === m.user._id ? 'selected' : ''}>${esc(m.user.name)}</option>`).join('');
  modal(`<h2>${editing ? 'Edit task' : 'Add a task'}</h2><form id="task-form"><label>Title</label><input name="title" required maxlength="160" value="${esc(task?.title)}"><label>Description</label><textarea name="description" maxlength="3000">${esc(task?.description)}</textarea><div class="grid"><div><label>Status</label><select name="status"><option value="todo">To Do</option><option value="in_progress">In Progress</option></select>${editing ? `<label class="done-toggle modal-done"><input type="checkbox" name="completed" ${task.status === 'done' ? 'checked' : ''}><span>Mark as done</span></label>` : ''}</div><div><label>Priority</label><select name="priority"><option>low</option><option selected>medium</option><option>high</option></select></div></div><div class="grid"><div><label>Assignee</label><select name="assignee"><option value="">Unassigned</option>${members}</select></div><div><label>Due date</label><input type="date" name="dueDate" value="${task?.dueDate ? dateInput(task.dueDate) : ''}"></div></div><div class="toolbar"><span class="spacer"></span><button class="quiet" type="button" data-close>Cancel</button><button>${editing ? 'Save changes' : 'Create task'}</button></div></form>`);
  const form = document.querySelector('#task-form'); if (task) { form.status.value = task.status === 'todo' ? 'todo' : 'in_progress'; form.priority.value = task.priority; }
  form.onsubmit = async e => { e.preventDefault(); const raw = Object.fromEntries(new FormData(form)); raw.assignee ||= null; raw.dueDate ||= null; if (editing) { raw.status = form.elements.completed.checked ? 'done' : raw.status; delete raw.completed; } try { await api(editing ? `/tasks/${task._id}` : `/projects/${state.project._id}/tasks`, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(raw) }); closeModal(); await projectPage(state.project._id); } catch (err) { showError(err, form.closest('.modal')); } };
}
const dateInput = v => new Date(v).toISOString().slice(0,10);
async function taskDetail(taskId) {
  try { const task = state.tasks.find(t => t._id === taskId); const { comments } = await api(`/tasks/${taskId}/comments`); state.modalTask = task; modal(`<div class="modal-head"><h2>${esc(task.title)}</h2><button class="modal-close" data-close>×</button></div><p class="muted">${esc(task.description || 'No description')}</p><div class="task-meta"><span class="badge ${esc(task.priority)}">${esc(task.priority)}</span><span>${esc(task.assignee?.name || 'Unassigned')} ${task.dueDate ? `· due ${date(task.dueDate)}` : ''}</span></div><div class="toolbar"><button id="edit-task" class="quiet">Edit task</button><button id="delete-task" class="danger">Delete task</button></div><h3>Comments</h3><div id="comments">${comments.map(commentHtml).join('') || '<p class="muted">No comments yet.</p>'}</div><form id="comment-form"><label>Add a comment</label><textarea name="body" required maxlength="2000" placeholder="Share an update…"></textarea><div class="toolbar"><span class="spacer"></span><button>Post comment</button></div></form>`); document.querySelector('#edit-task').onclick = () => taskForm(task); document.querySelector('#delete-task').onclick = async () => { if (confirm('Delete this task and its comments?')) { await api(`/tasks/${taskId}`, { method: 'DELETE' }); closeModal(); await projectPage(state.project._id); } }; document.querySelectorAll('[data-edit-comment]').forEach(button => button.onclick = async () => { const current = comments.find(c => c._id === button.dataset.editComment); const body = prompt('Edit your comment', current.body); if (body === null) return; try { await api(`/tasks/${taskId}/comments/${current._id}`, { method: 'PUT', body: JSON.stringify({ body }) }); await taskDetail(taskId); } catch (e) { showError(e, button.closest('.modal')); } }); document.querySelectorAll('[data-delete-comment]').forEach(button => button.onclick = async () => { if (!confirm('Delete your comment?')) return; try { await api(`/tasks/${taskId}/comments/${button.dataset.deleteComment}`, { method: 'DELETE' }); await taskDetail(taskId); } catch (e) { showError(e, button.closest('.modal')); } }); document.querySelector('#comment-form').onsubmit = async e => { e.preventDefault(); try { await api(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ body: new FormData(e.currentTarget).get('body') }) }); await taskDetail(taskId); } catch (err) { showError(err, e.currentTarget.closest('.modal')); } }; } catch (e) { notify(e.message); }
}
function commentHtml(c) { const mine = c.author?._id === state.user.id; return `<div class="comment"><strong>${esc(c.author?.name || 'Former member')}</strong><time>${new Date(c.createdAt).toLocaleString()}</time><p>${esc(c.body)}</p>${mine ? `<button class="link" data-edit-comment="${c._id}">Edit</button> <button class="link" data-delete-comment="${c._id}">Delete</button>` : ''}</div>`; }
function memberManager() { const owner = state.members.find(m => m.role === 'owner'); modal(`<div class="modal-head"><h2>Project members</h2><button class="modal-close" data-close>×</button></div><form id="member-form"><label>Add a member by email</label><div class="toolbar"><input type="email" name="email" required placeholder="teammate@example.com"><button>Add member</button></div></form><div id="member-list">${memberRows()}</div>`); document.querySelector('#member-form').onsubmit = async e => { e.preventDefault(); try { await api(`/projects/${state.project._id}/members`, { method: 'POST', body: JSON.stringify({ email: new FormData(e.currentTarget).get('email') }) }); await projectPage(state.project._id); memberManager(); } catch (err) { showError(err, e.currentTarget.closest('.modal')); } }; document.querySelectorAll('[data-remove-member]').forEach(b => b.onclick = async () => { try { await api(`/projects/${state.project._id}/members/${b.dataset.removeMember}`, { method: 'DELETE' }); await projectPage(state.project._id); memberManager(); } catch (e) { showError(e, b.closest('.modal')); } }); }
function memberRows() { return state.members.map(m => `<div class="member-row"><span><strong>${esc(m.user.name)}</strong><span class="muted"> · ${esc(m.user.email)}</span></span>${m.role === 'owner' ? '<span class="badge">Owner</span>' : `<button class="danger" data-remove-member="${m.user._id}">Remove</button>`}</div>`).join(''); }
async function deleteProject() { if (!confirm('Delete this project and all its tasks and comments?')) return; try { await api(`/projects/${state.project._id}`, { method: 'DELETE' }); location.hash = '#'; } catch (e) { notify(e.message); } }
async function profilePage() { app.innerHTML = `<div class="page-head"><div><h1>Your profile</h1><div class="muted">Only you can view and edit these details.</div></div></div><section class="panel" style="max-width:620px"><form id="profile-form"><label>Name</label><input name="name" required maxlength="80" value="${esc(state.user.name)}"><label>Email</label><input name="email" type="email" required value="${esc(state.user.email)}"><label>Bio</label><textarea name="bio" maxlength="500" placeholder="A little about you">${esc(state.user.bio)}</textarea><div class="toolbar"><button>Save profile</button></div></form></section>`; document.querySelector('#profile-form').onsubmit = async e => { e.preventDefault(); try { state.user = (await api('/users/me', { method: 'PUT', body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) })).user; renderNav(); notify('Profile saved'); } catch (err) { showError(err); } }; }
function modal(content) { const wrap = document.createElement('div'); wrap.className = 'modal-backdrop'; wrap.innerHTML = `<section class="modal">${content}</section>`; wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('[data-close]')) closeModal(); }); document.body.append(wrap); }
function closeModal() { document.querySelector('.modal-backdrop')?.remove(); }
window.addEventListener('hashchange', route);
route().catch(error => { app.innerHTML = `<section class="panel error">${esc(error.message)}</section>`; });
