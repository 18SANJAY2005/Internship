import {
  addTask,
  deleteTask,
  deriveTaskCounts,
  filterAndSortTasks,
  importTasks,
  readStoredTasks,
  updateTask
} from './taskModel.js';

const STORAGE_KEY = 'task-tracker-tasks-v1';

// [CHANGE 1] Configure both JSON file paths here
const SAMPLE_TASK_SOURCES = [
  '../tasks.json',
  '../extra-tasks.json'
];

const form = document.querySelector('.task-form');
const guidance = document.getElementById('form-guidance');
const announcement = document.getElementById('task-announcement');
const groupsContainer = document.querySelector('.task-groups');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('task-search');
const sortSelect = document.getElementById('task-sort');
const resetButton = document.getElementById('reset-tasks');
const importButton = document.getElementById('import-tasks');
const importStatus = document.getElementById('import-status');
const filterButtons = [...document.querySelectorAll('.filter-button')];

const groupLists = new Map(
  [...document.querySelectorAll('.task-group')].map((group) => [
    group.dataset.taskGroup,
    {
      element: group,
      list: group.querySelector('.task-list'),
      count: group.querySelector('.group-count')
    }
  ])
);

let activeFilter = 'all';
let tasks = [];
let editingTaskId = null;
let isImporting = false;

const submitButton = form.querySelector('button[type="submit"]');

function announce(message) {
  if (announcement) announcement.textContent = message;
}

function setImportState(state, message) {
  if (!importStatus) return;
  importStatus.hidden = !message;
  importStatus.textContent = message || '';
  importStatus.className = `import-status${state ? ` is-${state}` : ''}`;
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    announce(`Your change is active, but could not be saved in this browser: ${error.message}`);
    return false;
  }
}

function todayKey() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');
}

function dateGroup(task) {
  if (task.status === 'completed') return 'completed';

  const today = todayKey();

  if (task.dueDate < today) return 'overdue';
  if (task.dueDate === today) return 'today';

  const lastDayOfWeek = new Date(`${today}T00:00:00`);
  lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 7);

  const lastDayKey = [
    lastDayOfWeek.getFullYear(),
    String(lastDayOfWeek.getMonth() + 1).padStart(2, '0'),
    String(lastDayOfWeek.getDate()).padStart(2, '0')
  ].join('-');

  return task.dueDate <= lastDayKey ? 'this-week' : 'upcoming';
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function element(tagName, className, text) {
  const node = document.createElement(tagName);

  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;

  return node;
}

function createTaskCard(task) {
  const isCompleted = task.status === 'completed';
  const isOverdue = !isCompleted && task.dueDate < todayKey();

  const item = document.createElement('li');
  const card = element('article', 'task-card');

  card.dataset.taskId = task.id;

  if (isCompleted) card.classList.add('task-card-completed');
  if (isOverdue) card.classList.add('task-card-overdue');

  const main = element('div', 'task-main');
  const titleRow = element('div', 'task-title-row');

  titleRow.append(
    element('h4', '', task.title),
    element(
      'span',
      `status status-${isCompleted ? 'completed' : isOverdue ? 'overdue' : 'pending'}`,
      isCompleted ? 'Completed' : isOverdue ? 'Overdue — Pending' : 'Pending'
    )
  );

  main.append(
    titleRow,
    element('p', 'task-description', task.description)
  );

  const details = element('div', 'task-details');

  const due = element('span');
  due.append(element('strong', '', 'Due: '));

  const time = element('time', '', formatDate(task.dueDate));
  time.dateTime = task.dueDate;

  due.append(time);

  const priority = element('span');
  priority.append(element('strong', '', 'Priority: '));
  priority.append(
    element(
      'span',
      `priority priority-${task.priority}`,
      task.priority[0].toUpperCase() + task.priority.slice(1)
    )
  );

  const category = element('span');
  category.append(element('strong', '', 'Category: '));
  category.append(
    element(
      'span',
      'category-tag',
      task.category[0].toUpperCase() + task.category.slice(1)
    )
  );

  details.append(due, priority, category);
  main.append(details);

  const actions = element('div', 'task-actions');
  actions.setAttribute('aria-label', `Actions for ${task.title}`);

  const completeButton = element(
    'button',
    'button button-small button-complete',
    isCompleted ? 'Completed' : 'Mark Complete'
  );

  completeButton.type = 'button';
  completeButton.classList.add('task-complete');
  completeButton.disabled = isCompleted;

  if (isCompleted) {
    completeButton.setAttribute(
      'aria-label',
      `${task.title} is already completed`
    );
  }

  const deleteButton = element(
    'button',
    'button button-small button-delete',
    'Delete'
  );

  deleteButton.type = 'button';
  deleteButton.classList.add('task-delete');

  actions.append(completeButton, deleteButton);
  card.append(main, actions);
  item.append(card);

  return item;
}

function updateSummary() {
  const counts = deriveTaskCounts(tasks);

  const values = {
    '.summary-total strong': counts.total,
    '.summary-pending strong': counts.pending,
    '.summary-completed strong': counts.completed,
    '.summary-overdue strong': counts.overdue
  };

  Object.entries(values).forEach(([selector, value]) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = String(value);
  });

  const progress = document.querySelector('.progress-panel progress');
  const progressText = document.querySelector('.progress-copy p');
  const percentage = document.querySelector('.progress-copy strong');

  const percent = counts.total
    ? Math.round((counts.completed / counts.total) * 100)
    : 0;

  if (progress) {
    progress.max = Math.max(counts.total, 1);
    progress.value = counts.completed;
    progress.textContent = `${percent}%`;
  }

  if (progressText) {
    progressText.textContent =
      `${counts.completed} of ${counts.total} tasks completed`;
  }

  if (percentage) {
    percentage.textContent = `${percent}%`;
  }
}

function render() {
  const visibleTasks = filterAndSortTasks(tasks, {
    status: activeFilter,
    search: searchInput.value,
    sort: sortSelect.value
  });

  const tasksByGroup = new Map(
    [...groupLists.keys()].map((key) => [key, []])
  );

  visibleTasks.forEach((task) => {
    const group = tasksByGroup.get(dateGroup(task));
    if (group) group.push(task);
  });

  tasksByGroup.forEach((groupTasks, key) => {
    const group = groupLists.get(key);

    group.list.replaceChildren(...groupTasks.map(createTaskCard));

    group.count.textContent =
      `${groupTasks.length} ${groupTasks.length === 1 ? 'task' : 'tasks'}`;

    group.element.hidden = groupTasks.length === 0;
  });

  const listTotal = document.querySelector('#task-list .task-total');

  if (listTotal) {
    listTotal.textContent =
      `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;
  }

  if (emptyState) {
    emptyState.hidden = visibleTasks.length > 0;

    const message = emptyState.querySelector('p');

    if (message) {
      message.textContent = tasks.length
        ? 'No tasks match your current search and filter.'
        : 'There are no tasks here yet. Add a task to get started.';
    }
  }

  updateSummary();
}

function persistAndRender() {
  const saved = saveTasks();
  render();
  return saved;
}

function dispatchTaskEvent(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

// Create or update a task
form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!form.reportValidity()) return;

  const fields = new FormData(form);

  const taskData = {
    title: fields.get('task-title'),
    description: fields.get('task-description'),
    dueDate: fields.get('due-date'),
    priority: fields.get('priority'),
    category: fields.get('category')
  };

  try {
    if (editingTaskId) {
      const id = editingTaskId;

      tasks = updateTask(tasks, id, taskData);
      persistAndRender();

      dispatchTaskEvent(
        'tasktracker:task-updated',
        tasks.find((task) => task.id === id)
      );

      guidance.textContent = 'Task updated successfully.';
      editingTaskId = null;
    } else {
      tasks = addTask(tasks, taskData);
      persistAndRender();

      dispatchTaskEvent(
        'tasktracker:task-created',
        tasks[tasks.length - 1]
      );

      guidance.textContent = 'Task added successfully.';
    }

    form.reset();
    submitButton.textContent = 'Add Task';

  } catch (error) {
    guidance.textContent = error.message;
  }
});

// Reset form and exit edit mode
form.addEventListener('reset', () => {
  editingTaskId = null;
  submitButton.textContent = 'Add Task';
});

// [CHANGE 2] Reusable helper to fetch and validate a single JSON file
async function fetchTaskFile(url) {
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to load ${url}.`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Invalid JSON format in ${url}.`);
  }

  if (!Array.isArray(data)) {
    throw new Error(`Expected an array of tasks in ${url}.`);
  }

  return data;
}

// [CHANGE 3] Fetch both JSON files concurrently and combine their data
if (importButton) {
  importButton.addEventListener('click', async () => {
    if (isImporting) return;

    isImporting = true;
    importButton.disabled = true;
    importButton.textContent = 'Importing...';
    setImportState('loading', 'Fetching and combining sample tasks...');

    try {
      const results = await Promise.allSettled(
        SAMPLE_TASK_SOURCES.map((url) => fetchTaskFile(url))
      );

      // Extract only the arrays from fulfilled promises
      const fulfilledDatasets = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);

      const failedCount = results.length - fulfilledDatasets.length;

      if (fulfilledDatasets.length === 0) {
        const firstReason = results[0]?.reason?.message || 'All JSON sources failed to load.';
        throw new Error(firstReason);
      }

      const combinedRecords = fulfilledDatasets.flat();

      const { tasks: updatedTasks, importedCount } = importTasks(tasks, combinedRecords);
      tasks = updatedTasks;

      persistAndRender();
      dispatchTaskEvent('tasktracker:state-loaded', tasks);

      let message = importedCount > 0
        ? `Successfully imported ${importedCount} sample ${importedCount === 1 ? 'task' : 'tasks'}.`
        : 'Sample tasks are already imported.';

      if (failedCount > 0) {
        message += ` (${failedCount} file failed to load.)`;
      }

      setImportState('success', message);
      announce(message);
    } catch (error) {
      setImportState('error', `Import failed: ${error.message}`);
      announce(`Import failed: ${error.message}`);
    } finally {
      isImporting = false;
      importButton.disabled = false;
      importButton.textContent = 'Import Sample Tasks';
    }
  });
}

// Reset all tasks and leave the task tracker empty
if (resetButton) {
  resetButton.addEventListener('click', () => {
    if (tasks.length === 0) {
      announce('There are no tasks to reset.');
      return;
    }

    const confirmed = confirm(
      'Are you sure you want to delete all tasks? This action cannot be undone.'
    );

    if (!confirmed) return;

    tasks = [];

    form.reset();
    editingTaskId = null;
    setImportState('', '');

    guidance.textContent = 'All tasks have been deleted.';
    submitButton.textContent = 'Add Task';

    persistAndRender();

    // Synchronize the Kanban board with the empty task list.
    dispatchTaskEvent('tasktracker:state-loaded', tasks);

    announce('All tasks have been deleted successfully.');
  });
}

// Edit a task from the Kanban board
window.addEventListener('tasktracker:edit-request', ({ detail }) => {
  const task = tasks.find((item) => item.id === detail.id);

  if (!task) return;

  editingTaskId = task.id;

  form.elements.namedItem('task-title').value = task.title;
  form.elements.namedItem('task-description').value = task.description;
  form.elements.namedItem('due-date').value = task.dueDate;
  form.elements.namedItem('priority').value = task.priority;
  form.elements.namedItem('category').value = task.category;

  submitButton.textContent = 'Update Task';

  form.scrollIntoView({ behavior: 'smooth' });
});

// Delete a task from the Kanban board
window.addEventListener('tasktracker:delete-request', ({ detail }) => {
  const task = tasks.find((item) => item.id === detail.id);

  if (!task) return;

  if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
    return;
  }

  tasks = deleteTask(tasks, detail.id);
  persistAndRender();

  dispatchTaskEvent(
    'tasktracker:task-deleted',
    { id: detail.id }
  );

  announce(`${task.title} deleted.`);
});

// Filter tasks
document.querySelector('.filter-buttons').addEventListener('click', (event) => {
  const button = event.target.closest('.filter-button');

  if (!button) return;

  activeFilter = button.dataset.filter;

  filterButtons.forEach((filterButton) => {
    const isActive = filterButton === button;

    filterButton.classList.toggle('active', isActive);
    filterButton.setAttribute('aria-pressed', String(isActive));
  });

  render();
});

// Search and sort
searchInput.addEventListener('input', render);
sortSelect.addEventListener('change', render);

// Complete or delete tasks from the task list
groupsContainer.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  const card = button?.closest('.task-card');
  const id = card?.dataset.taskId;

  if (!button || !id) return;

  try {
    if (button.classList.contains('task-complete')) {
      tasks = updateTask(tasks, id, { status: 'completed' });

      const saved = persistAndRender();

      if (saved) {
        announce(`${card.querySelector('h4').textContent} marked complete.`);
      }

      dispatchTaskEvent(
        'tasktracker:app-status',
        { id, status: 'completed' }
      );

    } else if (button.classList.contains('task-delete')) {
      const task = tasks.find((item) => item.id === id);

      tasks = deleteTask(tasks, id);

      const saved = persistAndRender();

      if (saved) announce(`${task.title} deleted.`);

      dispatchTaskEvent(
        'tasktracker:task-deleted',
        { id }
      );
    }

  } catch (error) {
    announce(`Could not update task: ${error.message}`);
  }
});

// Update task status from the Kanban board
window.addEventListener('tasktracker:kanban-status', ({ detail }) => {
  if (!detail || !tasks.some((task) => task.id === detail.id)) return;

  const currentTask = tasks.find((task) => task.id === detail.id);

  if (currentTask.status === detail.status) return;

  try {
    tasks = updateTask(tasks, detail.id, { status: detail.status });

    const saved = persistAndRender();

    if (saved) {
      announce(
        `${currentTask.title} moved to ${detail.status.replace('-', ' ')}.`
      );
    }

  } catch (error) {
    announce(`Could not save the task status: ${error.message}`);
  }
});

// Load saved tasks from Local Storage
try {
  const stored = readStoredTasks(localStorage.getItem(STORAGE_KEY));

  tasks = stored.tasks;

  if (stored.recovered) {
    announce(
      'Saved task data was invalid, so the sample task list has been restored.'
    );
  }

} catch (error) {
  tasks = readStoredTasks(null).tasks;

  announce(
    `Browser storage is unavailable; changes will not persist. ${error.message}`
  );
}

// Initial render
render();
dispatchTaskEvent('tasktracker:state-loaded', tasks);