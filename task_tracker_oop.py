from task import Task
from task_exceptions import (
    TaskValidationError,
    TaskNotFoundError,
    DuplicateTaskError,
)
from task_storage import load_tasks, save_tasks


tasks = load_tasks()
next_task_id = max((task.task_id for task in tasks), default=0) + 1


def display_menu():
    print("\nTask Tracker Menu:")
    print("1. Add Task")
    print("2. View Tasks")
    print("3. Mark Task as Completed")
    print("4. Delete Task")
    print("5. Update Task Description")
    print("6. Exit")


def read_task_id(prompt):
    """Read a valid positive integer ID from the user."""
    raw_id = input(prompt).strip()
    try:
        task_id = int(raw_id)
    except ValueError as error:
        raise TaskValidationError("Task ID must contain numbers only.") from error

    if task_id <= 0:
        raise TaskValidationError("Task ID must be greater than zero.")
    return task_id


def find_task(task_id):
    for task in tasks:
        if task.task_id == task_id:
            return task
    raise TaskNotFoundError(f"Task ID {task_id} was not found.")


def add_task():
    global next_task_id

    title = input("Enter the Title of Task: ")
    description = input("Enter the Description of Task: ")
    priority = input("Enter Priority (Low/Medium/High): ")

    try:
        task = Task(next_task_id, title, description, priority)
    except (ValueError, TypeError) as error:
        raise TaskValidationError(str(error)) from error

    tasks.append(task)
    print("Task added successfully!")
    print("Task ID:", task.task_id)
    next_task_id += 1
    save_tasks(tasks)


def view_tasks():
    if not tasks:
        print("No tasks available.")
        return

    print("\nTasks:")
    for task in tasks:
        print(task)


def mark_task_completed():
    task_id = read_task_id("Enter the Task ID to mark as completed: ")
    task = find_task(task_id)
    task.mark_completed()
    print("Task marked as completed.")
    save_tasks(tasks)


def delete_task():
    task_id = read_task_id("Enter the Task ID to delete: ")
    task = find_task(task_id)
    tasks.remove(task)
    print("Task deleted successfully.")
    save_tasks(tasks)


def update_description():
    task_id = read_task_id("Enter task ID to update: ")
    task = find_task(task_id)

    new_description = input("Enter new description: ")
    try:
        task.update_description(new_description)
    except ValueError as error:
        raise TaskValidationError(str(error)) from error

    print("Task description updated successfully!")
    save_tasks(tasks)


def task_tracker():
    while True:
        display_menu()
        choice = input("Enter your choice: ").strip()

        try:
            match choice:
                case "1":
                    add_task()
                case "2":
                    view_tasks()
                case "3":
                    if not tasks:
                        print("No tasks available.")
                    else:
                        mark_task_completed()
                case "4":
                    if not tasks:
                        print("No tasks available.")
                    else:
                        delete_task()
                case "5":
                    if not tasks:
                        print("No tasks available to update!")
                    else:
                        update_description()
                case "6":
                    save_tasks(tasks)
                    print("Exiting Task Tracker.")
                    break
                case _:
                    print("Invalid Choice. Enter a number from 1 to 6.")

        except TaskValidationError as error:
            print("Invalid input:", error)
        except TaskNotFoundError as error:
            print("Task error:", error)
        except DuplicateTaskError as error:
            print("Duplicate task:", error)


if __name__ == "__main__":
    task_tracker()
