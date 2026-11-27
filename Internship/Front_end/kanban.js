/* Interactive Kanban board: native HTML Drag and Drop API + accessible move controls. */
(() => {
  'use strict';

  const board = document.querySelector('.kanban-board');
  if (!board) return;

  const statusLabels = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'in-review': 'In Review',
    'completed': 'Completed'
  };

  const announcement = document.getElementById('kanban-announcement');
  let draggedCard = null;

  const taskForm = document.querySelector(".task-form");

  const titleInput = document.querySelector("#task-title");
  const descriptionInput = document.querySelector("#task-description");
  const dueDateInput = document.querySelector("#due-date");
  const priorityInput = document.querySelector("#priority");
  const categoryInput = document.querySelector("#category");

  const todoColumn = getColumnForStatus("todo"); 

  function getCardTitle(card) {
    return card.querySelector('h4')?.textContent.trim() || 'Task';
  }

  function getColumnForStatus(status) {
    return board.querySelector(`.kanban-column[data-status="${status}"]`);
  }

  function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function createKanbanCard(task) {
    const item = document.createElement('li');
    const card = makeElement('article', 'kanban-card', '');
    card.dataset.status = task.status;
    card.dataset.taskId = task.id;
    card.draggable = true;

    const top = makeElement('div', 'kanban-card-top');
    top.append(
      makeElement('span', 'drag-handle', '⠿'),
      makeElement('span', 'kanban-current-status', statusLabels[task.status])
    );
    const menu = document.createElement('details');
    menu.className = 'card-menu';
    const summary = makeElement('summary', '', '•••');
    summary.setAttribute('aria-label', `More options for ${task.title}`);
    summary.title = 'Task options';
    const panel = makeElement('div', 'card-menu-panel');
    panel.setAttribute('aria-label', 'Task options');
    panel.append(makeElement('p', 'menu-heading', 'Task options'));

    const editButton = makeElement('button', '', 'Edit task');
    editButton.type = 'button';
    editButton.classList.add('kanban-edit-button');
    panel.append(editButton);

    const moveControl = makeElement('div', 'menu-move-control');
    const label = makeElement('label', '', 'Move to status');
    const select = document.createElement('select');
    select.className = 'menu-status-select';
    select.setAttribute('aria-label', `Move ${task.title} to status`);
    Object.keys(statusLabels).forEach((status) => {
      const option = makeElement('option', '', statusLabels[status]);
      option.value = status;
      option.selected = status === task.status;
      select.append(option);
    });
    label.htmlFor = `move-task-${task.id}`;
    select.id = label.htmlFor;
    const moveButton = makeElement('button', 'menu-move-button', 'Move task');
    moveButton.type = 'button';
    moveControl.append(label, select, moveButton);
    panel.append(moveControl);

    const deleteButton = makeElement('button', '', 'Delete task');
    deleteButton.type = 'button';
    deleteButton.classList.add('kanban-delete-button');
    panel.append(deleteButton);
    menu.append(summary, panel);
    top.append(menu);

    card.append(
      top,
      makeElement('h4', '', task.title),
      makeElement('p', 'kanban-card-description', task.description)
    );

    const metadata = makeElement('div', 'kanban-card-meta');
    const priority = document.createElement('div');
    priority.append(makeElement('span', 'meta-label', 'Priority'));
    priority.append(makeElement('span', `priority priority-${task.priority}`,
      task.priority[0].toUpperCase() + task.priority.slice(1)));
    const dueDate = document.createElement('div');
    dueDate.append(makeElement('span', 'meta-label', 'Due date'));
    const time = makeElement('time', '', new Date(`${task.dueDate}T00:00:00`).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }));
    time.dateTime = task.dueDate;
    dueDate.append(time);
    metadata.append(priority, dueDate);

    const footer = makeElement('footer', 'kanban-card-footer');
    footer.append(makeElement('span', 'drag-hint', 'Drag to move'));
    card.append(metadata, footer);
    item.append(card);
    return item;
  }

  function updateCardStatus(card, status) {
    if (!card || !statusLabels[status]) return;

    const oldStatus = card.dataset.status;
    card.dataset.status = status;
    card.classList.toggle('kanban-card-completed', status === 'completed');

    const statusBadge = card.querySelector('.kanban-current-status');
    if (statusBadge) statusBadge.textContent = statusLabels[status];

    const menuSelect = card.querySelector('.menu-status-select');
    if (menuSelect) menuSelect.value = status;

    if (oldStatus !== status) {
      window.dispatchEvent(new CustomEvent('tasktracker:kanban-status', {
        detail: { id: card.dataset.taskId, status }
      }));
      if (announcement) {
        announcement.textContent = `${getCardTitle(card)} moved to ${statusLabels[status]}.`;
      }
    }

    updateColumnCounts();
    updateDashboardSummary();
  }

  function updateColumnCounts() {
    board.querySelectorAll('.kanban-column').forEach((column) => {
      const count = column.querySelector('.kanban-count');
      const cards = column.querySelectorAll('.kanban-card-list > li .kanban-card').length;
      if (count) {
        count.textContent = String(cards);
        count.setAttribute('aria-label', `${cards} ${cards === 1 ? 'task' : 'tasks'}`);
      }
    });

    const total = board.querySelectorAll('.kanban-card').length;
    const totalLabel = document.querySelector('.task-total');
    if (totalLabel) totalLabel.textContent = `${total} ${total === 1 ? 'card' : 'cards'} on board`;
  }

  function updateDashboardSummary() {
    const cards = [...board.querySelectorAll('.kanban-card')];
    const total = cards.length;
    const completed = cards.filter((card) => card.dataset.status === 'completed').length;
    const pending = total - completed;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = cards.filter((card) => {
      if (card.dataset.status === 'completed') return false;
      const dateValue = card.querySelector('time')?.getAttribute('datetime');
      if (!dateValue) return false;
      const parts = dateValue.split('-').map(Number);
      if (parts.length !== 3 || parts.some(Number.isNaN)) return false;
      const dueDate = new Date(parts[0], parts[1] - 1, parts[2]);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }).length;

    const values = {
      '.summary-total strong': total,
      '.summary-pending strong': pending,
      '.summary-completed strong': completed,
      '.summary-overdue strong': overdue
    };
    Object.entries(values).forEach(([selector, value]) => {
      const element = document.querySelector(selector);
      if (element) element.textContent = String(value);
    });

    const progress = document.querySelector('.progress-panel progress');
    const progressCopy = document.querySelector('.progress-copy');
    if (progress) {
      progress.max = Math.max(total, 1);
      progress.value = completed;
      progress.textContent = `${total ? Math.round((completed / total) * 100) : 0}%`;
    }
    if (progressCopy) {
      const text = progressCopy.querySelector('p');
      const percentage = progressCopy.querySelector('strong');
      if (text) text.textContent = `${completed} of ${total} tasks completed`;
      if (percentage) percentage.textContent = `${total ? Math.round((completed / total) * 100) : 0}%`;
    }
  }

  function moveCard(card, destinationStatus) {
    const destinationColumn = getColumnForStatus(destinationStatus);
    const destinationList = destinationColumn?.querySelector('.kanban-card-list');
    if (!card || !destinationList || !statusLabels[destinationStatus]) return;

    const currentStatus = card.dataset.status;
    if (currentStatus === destinationStatus) {
      const menu = card.querySelector('.card-menu');
      if (menu) menu.open = false;
      return;
    }

    const listItem = card.closest('li');
    if (!listItem) return;

    // Append the task to the destination column, then update all status displays.
    destinationList.appendChild(listItem);
    updateCardStatus(card, destinationStatus);

    const menu = card.querySelector('.card-menu');
    if (menu) menu.open = false;
  }

  window.addEventListener('tasktracker:state-loaded', (event) => {
    const tasks = event.detail;
    if (!Array.isArray(tasks)) return;
    const taskIds = new Set(tasks.map((task) => task.id));

    board.querySelectorAll('.kanban-card').forEach((card) => {
      if (!taskIds.has(card.dataset.taskId)) card.closest('li')?.remove();
    });

    tasks.forEach((task) => {
      let card = board.querySelector(`.kanban-card[data-task-id="${CSS.escape(task.id)}"]`);
      if (!card) {
        const column = getColumnForStatus(task.status);
        const list = column?.querySelector('.kanban-card-list');
        if (!list) return;
        const item = createKanbanCard(task);
        list.append(item);
        card = item.querySelector('.kanban-card');
      } else if (card.dataset.status !== task.status) {
        moveCard(card, task.status);
      }
      if (card) card.setAttribute('aria-grabbed', 'false');
    });
    updateColumnCounts();
    updateDashboardSummary();
  });

  window.addEventListener('tasktracker:task-created', (event) => {
    const task = event.detail;
    if (!task || board.querySelector(`.kanban-card[data-task-id="${CSS.escape(task.id)}"]`)) return;
    const column = getColumnForStatus(task.status);
    const list = column?.querySelector('.kanban-card-list');
    if (!list) return;
    list.append(createKanbanCard(task));
    updateColumnCounts();
    updateDashboardSummary();
  });

  window.addEventListener('tasktracker:task-deleted', ({ detail }) => {
    const card = detail?.id
      ? board.querySelector(`.kanban-card[data-task-id="${CSS.escape(detail.id)}"]`)
      : null;
    card?.closest('li')?.remove();
    updateColumnCounts();
    updateDashboardSummary();
  });

  window.addEventListener('tasktracker:task-updated', ({ detail }) => {
    if (!detail) return;

    const oldCard = board.querySelector(
        `.kanban-card[data-task-id="${CSS.escape(detail.id)}"]`
    );

    if (!oldCard) return;

    const newItem = createKanbanCard(detail);
    oldCard.closest('li').replaceWith(newItem);

    updateColumnCounts();
    updateDashboardSummary();
});

  window.addEventListener('tasktracker:app-status', ({ detail }) => {
    const card = detail?.id
      ? board.querySelector(`.kanban-card[data-task-id="${CSS.escape(detail.id)}"]`)
      : null;
    if (card) moveCard(card, detail.status);
  });

  function clearDropHighlights() {
    board.querySelectorAll('.kanban-column.is-drag-over').forEach((column) => {
      column.classList.remove('is-drag-over');
    });
  }

  // Start dragging a card. Ignore clicks/drags on the options menu controls.
  board.addEventListener('dragstart', (event) => {
    const card = event.target.closest('.kanban-card');
    if (!card || event.target.closest('.card-menu')) {
      event.preventDefault();
      return;
    }

    draggedCard = card;
    card.setAttribute('aria-grabbed', 'true');
    card.classList.add('is-dragging');

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', card.dataset.taskId || getCardTitle(card));
    }
  });

  // Allow a card to be dropped anywhere inside a Kanban column.
  board.addEventListener('dragover', (event) => {
    const column = event.target.closest('.kanban-column');
    if (!draggedCard || !column) return;

    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    clearDropHighlights();
    column.classList.add('is-drag-over');
  });

  board.addEventListener('drop', (event) => {
    const column = event.target.closest('.kanban-column');
    if (!draggedCard || !column) return;

    event.preventDefault();
    const destinationStatus = column.dataset.status;
    moveCard(draggedCard, destinationStatus);
    draggedCard.classList.remove('is-dragging');
    draggedCard.removeAttribute('aria-grabbed');
    draggedCard = null;
    clearDropHighlights();
  });

  board.addEventListener('dragleave', (event) => {
    const column = event.target.closest('.kanban-column');
    if (!column || column.contains(event.relatedTarget)) return;
    column.classList.remove('is-drag-over');
  });

  board.addEventListener('dragend', () => {
    if (draggedCard) {
      draggedCard.classList.remove('is-dragging');
      draggedCard.removeAttribute('aria-grabbed');
    }
    draggedCard = null;
    clearDropHighlights();
  });

  // Accessible alternative to dragging: choose a status and activate Move task.
  board.addEventListener('click', (event) => {
    const editButton = event.target.closest('.kanban-edit-button');
    const deleteButton = event.target.closest('.kanban-delete-button');
    const moveButton = event.target.closest('.menu-move-button');

    const card = event.target.closest('.kanban-card');
    if (!card) return;

    const id = card.dataset.taskId;

    if (editButton) {
        window.dispatchEvent(
            new CustomEvent('tasktracker:edit-request', {
                detail: { id }
            })
        );
    }

    if (deleteButton) {
        window.dispatchEvent(
            new CustomEvent('tasktracker:delete-request', {
                detail: { id }
            })
        );
    }

    if (moveButton) {
        const select = card.querySelector('.menu-status-select');
        if (select) moveCard(card, select.value);
    }
});
  // Keep all initial counts and labels consistent on page load.
  board.querySelectorAll('.kanban-card').forEach((card) => {
    card.setAttribute('aria-grabbed', 'false');
    const select = card.querySelector('.menu-status-select');
    if (select) select.value = card.dataset.status;
  });
  updateColumnCounts();
  updateDashboardSummary();
})();
