"""Reusable Task data model."""


class Task:
    VALID_PRIORITIES = {"Low", "Medium", "High"}
    VALID_STATUSES = {"Pending", "Completed"}

    def __init__(self, task_id, title, description, priority="Medium", status="Pending"):
        # Validate values before creating the task object.
        if isinstance(task_id, bool) or not isinstance(task_id, int) or task_id <= 0:
            raise ValueError("Task ID must be a positive whole number.")

        if not isinstance(title, str) or not title.strip():
            raise ValueError("Title cannot be empty.")

        if not isinstance(description, str) or not description.strip():
            raise ValueError("Description cannot be empty.")

        if not isinstance(priority, str):
            raise ValueError("Priority must be Low, Medium or High.")
        priority = priority.strip().title()
        if priority not in self.VALID_PRIORITIES:
            raise ValueError("Priority must be Low, Medium or High.")

        if not isinstance(status, str):
            raise ValueError("Status must be Pending or Completed.")
        status = status.strip().title()
        if status not in self.VALID_STATUSES:
            raise ValueError("Status must be Pending or Completed.")

        self.task_id = task_id
        self.title = title.strip()
        self.description = description.strip()
        self.priority = priority
        self.status = status

    def mark_completed(self):
        self.status = "Completed"

    def update_description(self, new_description):
        if not isinstance(new_description, str) or not new_description.strip():
            raise ValueError("Description cannot be empty.")
        self.description = new_description.strip()

    def to_dict(self):
        return {
            "id": self.task_id,
            "title": self.title,
            "description": self.description,
            "priority": self.priority,
            "status": self.status,
        }

    @classmethod
    def from_dict(cls, data):
        required = {"id", "title", "description", "priority", "status"}
        if not isinstance(data, dict) or not required.issubset(data):
            raise ValueError("A task record is missing required fields.")
        return cls(
            data["id"], data["title"], data["description"],
            data["priority"], data["status"]
        )

    def __str__(self):
        return (
            f"ID: {self.task_id}, Title: {self.title}, "
            f"Description: {self.description}, Priority: {self.priority}, "
            f"Status: {self.status}"
        )
