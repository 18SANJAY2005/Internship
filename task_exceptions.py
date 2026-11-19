"""Custom exceptions for the OOP Task Tracker."""


class TaskValidationError(Exception):
    """Raised when task details are invalid."""


class TaskNotFoundError(Exception):
    """Raised when a requested task ID does not exist."""


class DuplicateTaskError(Exception):
    """Raised when a task ID is already used."""
