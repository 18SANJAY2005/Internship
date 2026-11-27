# Description

A simple command line tracker that allows user to manage daily tasks.

# Requirements

Python 3.10 or above

# Setup

Navigate to your folder
``` Bash
Python task_tracker.py
```

## Browser task tracker

The interactive web app is in `Front_end`. Serve the folder over HTTP so the
JavaScript modules load correctly:

```powershell
cd Front_end
python -m http.server 8000
```

Open `http://localhost:8000` in a browser. The app includes sample tasks,
validated task operations, search/filter/sort, a live summary, synchronized
Kanban status changes, and LocalStorage persistence with recovery for invalid
saved data.

The reusable operations (`addTask`, `updateTask`, `deleteTask`, `findTask`,
`deriveTaskCounts`, and `filterAndSortTasks`) are in `Front_end/taskModel.js`.
Run their tests from the `Internship` folder with:

```powershell
node --experimental-default-type=module --test Front_end/taskModel.test.js


