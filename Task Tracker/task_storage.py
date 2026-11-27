"""JSON persistence functions for Task objects."""

import json
from pathlib import Path

from task import Task


BASE_DIR = Path(__file__).resolve().parent
JSON_FILE = BASE_DIR / "tasks.json"


def save_tasks(tasks, file_path=JSON_FILE):
    """Save task objects to a JSON file."""
    try:
        path = Path(file_path)
        with path.open("w", encoding="utf-8") as file:
            json.dump([task.to_dict() for task in tasks], file, indent=4)
        print("Tasks saved successfully!")
        return True
    except (OSError, TypeError) as error:
        print("Error saving tasks:", error)
        return False


def load_tasks(file_path=JSON_FILE):
    """Load and validate tasks. Missing or invalid files produce an empty list."""
    try:
        with Path(file_path).open("r", encoding="utf-8") as file:
            data = json.load(file)

        if not isinstance(data, list):
            raise ValueError("JSON content must be a list of tasks.")

        loaded_tasks = []
        used_ids = set()

        for record in data:
            task = Task.from_dict(record)
            if task.task_id in used_ids:
                raise ValueError(f"Duplicate task ID {task.task_id} in JSON file.")
            used_ids.add(task.task_id)
            loaded_tasks.append(task)

        print(f"Loaded {len(loaded_tasks)} task(s).")
        return loaded_tasks

    except FileNotFoundError:
        print("Task data file not found. Starting with an empty task list.")
        return []
    except json.JSONDecodeError as error:
        print(
            f"Malformed JSON in task file at line {error.lineno}, "
            f"column {error.colno}. Starting with an empty task list."
        )
        return []
    except (OSError, ValueError, TypeError) as error:
        print("Invalid task data:", error)
        return []
