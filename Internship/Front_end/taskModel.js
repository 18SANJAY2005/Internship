export const TASK_STATUSES = Object.freeze(['todo', 'in-progress', 'in-review', 'completed']);
export const TASK_PRIORITIES = Object.freeze(['low', 'medium', 'high']);
export const TASK_CATEGORIES = Object.freeze(['work', 'personal', 'study', 'shopping', 'health']);

const priorityOrder = { high: 0, medium: 1, low: 2 };

export const sampleTasks = Object.freeze([
  {
    id: 'submit-project-proposal',
    title: 'Submit project proposal',
    description: 'Review the final proposal and send it to the project mentor.',
    priority: 'high',
    category: 'work',
    status: 'in-review',
    dueDate: '2026-11-18',
    createdAt: '2026-11-17T09:00:00.000Z',
    updatedAt: '2026-11-17T09:00:00.000Z'
  },
  {
    id: 'complete-html-assignment',
    title: 'Complete HTML assignment',
    description: 'Finish the semantic HTML structure and check all form labels.',
    priority: 'high',
    category: 'study',
    status: 'in-progress',
    dueDate: '2026-11-20',
    createdAt: '2026-11-20T09:00:00.000Z',
    updatedAt: '2026-11-20T09:00:00.000Z'
  },
  {
    id: 'review-css-flexbox',
    title: 'Review CSS Flexbox',
    description: 'Practise alignment, wrapping and responsive layouts.',
    priority: 'low',
    category: 'study',
    status: 'in-progress',
    dueDate: '2026-11-22',
    createdAt: '2026-11-20T09:00:00.000Z',
    updatedAt: '2026-11-20T09:00:00.000Z'
  },
  {
    id: 'plan-weekly-schedule',
    title: 'Plan weekly schedule',
    description: "Prepare a realistic plan for next week's learning and work.",
    priority: 'medium',
    category: 'personal',
    status: 'todo',
    dueDate: '2026-11-24',
    createdAt: '2026-11-20T09:00:00.000Z',
    updatedAt: '2026-11-20T09:00:00.000Z'
  },
  {
    id: 'practice-python',
    title: 'Practice Python',
    description: 'Revise functions, lists and dictionary operations.',
    priority: 'medium',
    category: 'study',
    status: 'completed',
    dueDate: '2026-11-19',
    createdAt: '2026-11-18T09:00:00.000Z',
    updatedAt: '2026-11-19T12:00:00.000Z'
  }
]);

function assertTask(task) {
  if (!task || typeof task !== 'object') {
    throw new TypeError('A task must be an object.');
  }

  const title = typeof task.title === 'string' ? task.title.trim() : '';
  if (title.length < 3 || title.length > 100) {
    throw new TypeError('Task titles must be between 3 and 100 characters.');
  }
  if (!TASK_PRIORITIES.includes(task.priority)) {
    throw new TypeError('Choose a valid task priority.');
  }
  if (!TASK_CATEGORIES.includes(task.category)) {
    throw new TypeError('Choose a valid task category.');
  }
  if (!TASK_STATUSES.includes(task.status)) {
    throw new TypeError('Choose a valid task status.');
  }
  const dateParts = typeof task.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)
    ? task.dueDate.split('-').map(Number)
    : [];
  const parsedDate = dateParts.length === 3
    ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
    : null;
  if (!parsedDate
    || parsedDate.getFullYear() !== dateParts[0]
    || parsedDate.getMonth() !== dateParts[1] - 1
    || parsedDate.getDate() !== dateParts[2]) {
    throw new TypeError('A task due date must use YYYY-MM-DD format.');
  }
  if (typeof task.description !== 'string' || task.description.length > 300) {
    throw new TypeError('Task descriptions must be 300 characters or fewer.');
  }
  return { ...task, title };
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function addTask(tasks, input, now = new Date()) {
  const task = assertTask({
    ...input,
    id: input.id || createId(),
    description: input.description || '',
    status: input.status || 'todo',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  });
  return [...tasks, task];
}

export function findTask(tasks, id) {
  return tasks.find((task) => task.id === id);
}

export function updateTask(tasks, id, changes, now = new Date()) {
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) throw new RangeError(`Task not found: ${id}`);

  const updatedTask = assertTask({
    ...tasks[index],
    ...changes,
    id: tasks[index].id,
    createdAt: tasks[index].createdAt,
    updatedAt: now.toISOString()
  });
  return tasks.map((task, taskIndex) => taskIndex === index ? updatedTask : task);
}

export function deleteTask(tasks, id) {
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) throw new RangeError(`Task not found: ${id}`);
  return tasks.filter((task) => task.id !== id);
}

export function deriveTaskCounts(tasks, today = new Date()) {
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');
  const completed = tasks.filter((task) => task.status === 'completed').length;
  const overdue = tasks.filter((task) =>
    task.status !== 'completed' && task.dueDate < todayKey
  ).length;

  return {
    total: tasks.length,
    completed,
    pending: tasks.length - completed,
    overdue
  };
}

export function filterAndSortTasks(tasks, { status = 'all', search = '', sort = 'dueDate' } = {}) {
  const query = search.trim().toLocaleLowerCase();
  const filtered = tasks.filter((task) => {
    const matchesStatus = status === 'all'
      || (status === 'pending' && task.status !== 'completed')
      || task.status === status;
    const searchableText = `${task.title} ${task.description} ${task.category}`.toLocaleLowerCase();
    return matchesStatus && (!query || searchableText.includes(query));
  });

  return [...filtered].sort((first, second) => {
    if (sort === 'priority') {
      return priorityOrder[first.priority] - priorityOrder[second.priority]
        || first.dueDate.localeCompare(second.dueDate);
    }
    if (sort === 'title') return first.title.localeCompare(second.title);
    return first.dueDate.localeCompare(second.dueDate);
  });
}

function isValidStoredTask(task) {
  try {
    return Boolean(
      typeof task.id === 'string'
      && task.id.length > 0
      && typeof task.createdAt === 'string'
      && typeof task.updatedAt === 'string'
      && assertTask(task)
    );
  } catch {
    return false;
  }
}

export function readStoredTasks(serializedTasks) {
  if (serializedTasks === null) {
    return { tasks: sampleTasks.map((task) => ({ ...task })), recovered: false };
  }

  try {
    const tasks = JSON.parse(serializedTasks);
    if (!Array.isArray(tasks)
      || !tasks.every(isValidStoredTask)
      || new Set(tasks.map((task) => task.id)).size !== tasks.length) {
      throw new TypeError('Saved tasks are not valid.');
    }
    return { tasks, recovered: false };
  } catch {
    return { tasks: sampleTasks.map((task) => ({ ...task })), recovered: true };
  }
}

export function mapImportedTask(record, defaultDueDate) {
  if (!record || typeof record !== 'object') {
    throw new TypeError('Imported task record must be an object.');
  }

  const rawStatus = typeof record.status === 'string'
    ? record.status.trim().toLowerCase().replace(/\s+/g, '-')
    : 'todo';

  const statusMap = {
    'todo': 'todo',
    'to-do': 'todo',
    'pending': 'todo',
    'in-progress': 'in-progress',
    'in-review': 'in-review',
    'completed': 'completed',
    'done': 'completed'
  };

  const priority = typeof record.priority === 'string'
    ? record.priority.trim().toLowerCase()
    : 'medium';

  const category = typeof record.category === 'string'
    ? record.category.trim().toLowerCase()
    : 'study';

  return assertTask({
    id: record.id !== undefined && record.id !== null
      ? `imported-${String(record.id).trim()}`
      : createId(),
    title: record.title,
    description: typeof record.description === 'string' ? record.description : '',
    priority: TASK_PRIORITIES.includes(priority) ? priority : 'medium',
    category: TASK_CATEGORIES.includes(category) ? category : 'study',
    status: statusMap[rawStatus] || 'todo',
    dueDate: typeof record.dueDate === 'string' ? record.dueDate : defaultDueDate,
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || new Date().toISOString()
  });
}

export function importTasks(existingTasks, rawRecords, now = new Date()) {
  if (!Array.isArray(rawRecords)) {
    throw new TypeError('Expected an array of tasks in JSON.');
  }

  const defaultDueDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-');

  const existingIds = new Set(existingTasks.map((t) => t.id));
  const nextTasks = [...existingTasks];
  let importedCount = 0;

  for (const record of rawRecords) {
    const mapped = mapImportedTask(record, defaultDueDate);
    if (!existingIds.has(mapped.id)) {
      existingIds.add(mapped.id);
      nextTasks.push(mapped);
      importedCount += 1;
    }
  }

  return { tasks: nextTasks, importedCount };
}
