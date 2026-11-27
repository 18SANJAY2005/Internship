from soupsieve import match
from sqlalchemy import case


tasks=[]
next_task_id = 1    


def display_menu():
    print("Task Tracker Menu:")
    print("1. Add Task")
    print("2. View Tasks")
    print("3. Mark Task as Completed")
    print("4. Delete Task")
    print("5. Update Task Description")
    print("6. Exit")


def add_task():
    global next_task_id

    title = input("Enter the Title of Taks: ")
    if title == "":
        print("Title Can not be Empty:")
        return

    description = input("Enter the Description of Task: ")

    task = {
        "id": next_task_id,
        "title": title,
        "description": description,     
        "status": "Pending"
    }
    tasks.append(task)
    print("Task added Successfully: ")
    print("Task ID", next_task_id)

    next_task_id = next_task_id + 1

def view_tasks():
    if len(tasks) == 0:
        print("No tasks available.")
        return

    print("Tasks:")
    for task in tasks:

        print(f"ID: {task['id']}, Title: {task['title']}, Description: {task['description']}, Status: {task['status']}")

def mark_task_completed():
    if len(tasks) == 0:
        print("No tasks available.")
        return
    task_id = int(input("Enter the Task ID to mark as completed: "))
    for task in tasks:
        if task["id"] == task_id:
            task["status"] = "Completed"
            print("Task marked as completed.")
            return
    print("Invalid Task ID.")

def delete_task():
    if len(tasks) == 0:
        print("No tasks available.")
        return
    task_id = int(input("Enter the Task ID to delete: "))
    for task in tasks:
        if task["id"] == task_id:
            tasks.remove(task)
            print("Task deleted successfully.")
            return
    print("Task not found.")


def find_task(task_id):
    for task in tasks:
        if str(task["id"]) == str(task_id):
            return task
    return None



def update_description():

    if len(tasks) == 0:
        print("No tasks available to update!")
        return

    task_id = input("Enter task ID to update: ")

    task = find_task(task_id)

    if task is None:
        print("Invalid task ID! Task not found.")
        return

    new_description = input("Enter new description: ")

    if new_description == "":
        print("Description cannot be empty!")
        return

    task["description"] = new_description

    print("Task description updated successfully!")



def task_tracker():
    while True:

     display_menu()

     choice = input("Enter your choice: ")

     match choice:
         case "1":
            add_task()
         case "2":
            view_tasks()
         case "3":
            mark_task_completed()
         case "4":
            delete_task()
         case "5":
            update_description()
         case "6":
            print("Exiting Task Tracker")
            break
         case _:
             print("Invalid Choice")


if __name__ == "__main__":
    task_tracker()
