import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addTask,
  deleteTask,
  deriveTaskCounts,
  filterAndSortTasks,
  findTask,
  readStoredTasks,
  sampleTasks,
  updateTask
} from './taskModel.js';

const fixedNow = new Date('2026-11-23T12:00:00.000Z');

test('task operations add, find, update and delete without mutating input arrays', () => {
  const initialTasks = sampleTasks.map((task) => ({ ...task }));
  const addedTasks = addTask(initialTasks, {
    id: 'new-task',
    title: 'Build reusable model',
    description: 'Implement task CRUD operations.',
    dueDate: '2026-11-25',
    priority: 'high',
    category: 'study'
  }, fixedNow);

  assert.equal(initialTasks.length, 5);
  assert.equal(findTask(addedTasks, 'new-task').createdAt, fixedNow.toISOString());

  const completedTasks = updateTask(addedTasks, 'new-task', { status: 'completed' }, fixedNow);
  assert.equal(findTask(completedTasks, 'new-task').status, 'completed');
  assert.equal(findTask(addedTasks, 'new-task').status, 'todo');

  const remainingTasks = deleteTask(completedTasks, 'new-task');
  assert.equal(findTask(remainingTasks, 'new-task'), undefined);
  assert.throws(() => updateTask(remainingTasks, 'missing', { status: 'completed' }), RangeError);
});

test('filter and sort compose without changing the source order', () => {
  const tasks = sampleTasks.map((task) => ({ ...task }));
  const sourceIds = tasks.map((task) => task.id);
  const results = filterAndSortTasks(tasks, {
    status: 'pending',
    search: 'study',
    sort: 'priority'
  });

  assert.deepEqual(results.map((task) => task.id), [
    'complete-html-assignment',
    'review-css-flexbox'
  ]);
  assert.deepEqual(tasks.map((task) => task.id), sourceIds);
});

test('counts completed and overdue tasks using the supplied current date', () => {
  assert.deepEqual(deriveTaskCounts(sampleTasks, fixedNow), {
    total: 5,
    completed: 1,
    pending: 4,
    overdue: 3
  });
});

test('malformed or invalid stored data recovers to independent sample copies', () => {
  const malformed = readStoredTasks('{bad json');
  const invalidDate = readStoredTasks(JSON.stringify([
    { ...sampleTasks[0], dueDate: '2026-02-31' }
  ]));
  const duplicateIds = readStoredTasks(JSON.stringify([sampleTasks[0], sampleTasks[0]]));
  const missing = readStoredTasks(null);

  assert.equal(malformed.recovered, true);
  assert.equal(invalidDate.recovered, true);
  assert.equal(duplicateIds.recovered, true);
  assert.equal(missing.recovered, false);
  assert.equal(malformed.tasks.length, sampleTasks.length);
  malformed.tasks[0].title = 'Changed locally';
  assert.notEqual(sampleTasks[0].title, 'Changed locally');
});
