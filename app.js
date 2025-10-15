const columns = ['Backlog', 'In Progress', 'Review', 'Done'];
let issues = JSON.parse(localStorage.getItem('issues')) || [];
let filteredIssues = [...issues];
let draggedId = null;
let editing = false;

const themeSwitch = document.getElementById('themeSwitch');
const searchInput = document.getElementById('searchInput');
const filterField = document.getElementById('filterField');

function loadTheme() {
  const theme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (theme === 'dark' || (!theme && prefersDark)) {
    document.documentElement.classList.add('dark');
    themeSwitch.checked = true;
  } else {
    document.documentElement.classList.remove('dark');
    themeSwitch.checked = false;
  }
}

themeSwitch.addEventListener('change', () => {
  const isDark = themeSwitch.checked;
  document.documentElement.classList.toggle('dark', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

loadTheme();

const priorityColors = {
  low: 'bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-100',
  medium: 'bg-yellow-200 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100',
  high: 'bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-100',
  critical: 'bg-pink-200 dark:bg-pink-700 text-pink-800 dark:text-pink-100',
};

function saveIssues() {
  localStorage.setItem('issues', JSON.stringify(issues));
}

function renderBoard() {
  const board = document.getElementById('kanbanBoard');
  board.innerHTML = '';

  columns.forEach((status) => {
    const col = document.createElement('div');
    col.className = 'flex flex-col bg-gray-200 dark:bg-gray-800 rounded-lg p-4 min-h-[300px] transition-colors duration-300';
    col.dataset.status = status;

    const header = document.createElement('h3');
    header.className = 'text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200 border-b border-gray-400 dark:border-gray-600 pb-2';
    header.textContent = status;
    col.appendChild(header);

    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(col, e.clientY);
      const draggable = document.querySelector('.dragging');
      if (afterElement == null) col.appendChild(draggable);
      else col.insertBefore(draggable, afterElement);
    });

    col.addEventListener('drop', (e) => {
      e.preventDefault();
      const dragged = issues.find(i => i.id === draggedId);
      if (!dragged) return;
      const newStatus = col.dataset.status;
      const afterEl = getDragAfterElement(col, e.clientY);
      issues = issues.filter(i => i.id !== draggedId);
      if (afterEl) {
        const afterId = parseInt(afterEl.dataset.id);
        const idx = issues.findIndex(i => i.id === afterId);
        issues.splice(idx, 0, { ...dragged, status: newStatus });
      } else {
        issues.push({ ...dragged, status: newStatus });
      }
      saveIssues();
      filterIssues();
    });

    const filtered = filteredIssues.filter((i) => i.status === status);
    if (filtered.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'text-gray-500 dark:text-gray-400 italic text-sm';
      empty.textContent = 'Nessuna issue';
      col.appendChild(empty);
    } else {
      filtered.forEach((issue) => {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-700 rounded-md p-4 mb-4 shadow-sm dark:shadow-md cursor-move transition-colors duration-300';
        card.draggable = true;
        card.dataset.id = issue.id;

        card.addEventListener('dragstart', () => {
          draggedId = issue.id;
          card.classList.add('dragging');
        });
        card.addEventListener('dragend', () => {
          card.classList.remove('dragging');
          draggedId = null;
        });

        const top = document.createElement('div');
        top.className = 'flex justify-between items-center mb-2';
        const titleEl = document.createElement('h4');
        titleEl.className = 'font-bold text-gray-800 dark:text-gray-100';
        titleEl.textContent = issue.title;

        const priorities = ['low', 'medium', 'high', 'critical'];
        const pri = document.createElement('span');
        pri.className = `text-xs font-semibold px-2 py-1 rounded-full ${priorityColors[issue.priority]} cursor-pointer`;
        pri.textContent = issue.priority;

        // Click per aumentare la priorità
        pri.addEventListener('click', () => {
          let idx = priorities.indexOf(issue.priority);
          idx = (idx + 1) % priorities.length;
          issue.priority = priorities[idx];
          saveIssues();
          filterIssues();
        });

        top.append(titleEl, pri);
        card.appendChild(top);

        const desc = document.createElement('p');
        desc.className = 'text-sm text-gray-600 dark:text-gray-300';
        desc.textContent = issue.description;
        card.appendChild(desc);

        const footer = document.createElement('div');
        footer.className = 'flex justify-between items-center mt-4 text-sm';
        const assigneeEl = document.createElement('span');
        assigneeEl.className = 'inline-block bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-semibold px-3 py-1 rounded-full';
        assigneeEl.textContent = issue.assignee;
        const btns = document.createElement('div');
        btns.className = 'flex gap-2';
        const editBtn = document.createElement('button');
        editBtn.className = 'text-blue-600 dark:text-blue-400 hover:underline';
        editBtn.textContent = 'Modifica';
        editBtn.onclick = () => editIssue(issue.id);
        const delBtn = document.createElement('button');
        delBtn.className = 'text-red-600 dark:text-red-400 hover:underline';
        delBtn.textContent = 'Elimina';
        delBtn.onclick = () => deleteIssue(issue.id);
        btns.append(editBtn, delBtn);
        footer.append(assigneeEl, btns);
        card.appendChild(footer);

        col.appendChild(card);
      });
    }
    board.appendChild(col);
  });
}

function getDragAfterElement(container, y) {
  const elements = [...container.querySelectorAll('.bg-white.dark\\:bg-gray-700:not(.dragging)')];
  return elements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function openForm() {
  editing = false;
  document.getElementById('modalTitle').textContent = 'Crea una nuova issue';
  document.getElementById('issueForm').reset();
  document.getElementById('editId').value = '';
  document.getElementById('modal').classList.remove('hidden');
}

function closeForm() {
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('issueForm').reset();
  editing = false;
}

document.getElementById('issueForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const data = {
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    assignee: document.getElementById('assignee').value.trim(),
    priority: document.getElementById('priority').value
  };

  if (editing && id) {
    const idx = issues.findIndex((i) => i.id == id);
    if (idx >= 0) issues[idx] = { ...issues[idx], ...data };
  } else {
    issues.push({ id: Date.now(), ...data, status: 'Backlog' });
  }
  saveIssues();
  filterIssues();
  closeForm();
});

function editIssue(id) {
  const issue = issues.find((i) => i.id === id);
  if (!issue) return;
  editing = true;
  document.getElementById('modalTitle').textContent = 'Modifica Issue';
  document.getElementById('editId').value = issue.id;
  document.getElementById('title').value = issue.title;
  document.getElementById('description').value = issue.description;
  document.getElementById('assignee').value = issue.assignee;
  document.getElementById('priority').value = issue.priority;
  document.getElementById('modal').classList.remove('hidden');
}

function deleteIssue(id) {
  issues = issues.filter((i) => i.id !== id);
  saveIssues();
  filterIssues();
}

function filterIssues() {
  const q = searchInput.value.trim().toLowerCase();
  const field = filterField.value;
  filteredIssues = issues.filter((i) => {
    if (!q) return true;
    if (field === 'all')
      return [i.title, i.description, i.assignee, i.priority].join(' ').toLowerCase().includes(q);
    return i[field].toLowerCase().includes(q);
  });
  renderBoard();
}

searchInput.addEventListener('input', filterIssues);
filterField.addEventListener('change', filterIssues);
filterIssues();
