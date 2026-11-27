# Task Tracker

A task management application built with Python, HTML, CSS and JavaScript. The project demonstrates CRUD operations, task filtering, sorting, validation, browser persistence and JSON data import.

## Features

- Create, read, update and delete tasks
- Set task priority and status
- Search tasks by title
- Filter tasks by status and priority
- Sort tasks
- Validate task inputs
- Save tasks using browser storage
- Import tasks from JSON
- Handle invalid data and import errors
- Responsive user interface

## Technologies Used

- Python
- HTML5
- CSS3
- JavaScript (ES6+)
- Fetch API
- JSON
- LocalStorage

## Project Structure

```text
task-tracker/
├── index.html
├── styles.css
├── kanban.js
├── taskApp.js
├── taskModel.js
├── tasks.json
├── task.py
├── task_exceptions.py
├── tests/
└── README.md
```

## Getting Started

### Requirements

- Python 3
- A modern web browser
- Visual Studio Code or another code editor

### Run the Web Application

1. Open the project folder.
2. Start a local server from the project directory:

   ```bash
   python -m http.server 8000
   ```

3. Open your browser and visit:

   ```text
   http://localhost:8000
   ```

### Run the Python Application

Run the Python entry-point file:

```bash
python task.py
```

## Data Model

Each task contains:

| Field | Description |
|---|---|
| task_id | Unique task identifier |
| title | Task title |
| description | Task details |
| priority | Task priority |
| status | Current task status |

## Screenshots

Add screenshots of:

- Main task dashboard
- Creating or editing a task
- Filtering and sorting
- JSON import

## Known Limitations

- Browser storage is local to the browser.
- Imported JSON must follow the expected task structure.
- The application does not currently use a remote database.

## Future Improvements

- Add a backend API
- Add database storage
- Add user authentication
- Add automated end-to-end tests

## Author

Add your name and project repository link here.
