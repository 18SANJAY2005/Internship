import json
import pytest

from task import Task
from task_exceptions import TaskNotFoundError
from task_storage import load_tasks, save_tasks
from task_tracker_oop import find_task


def test_task_has_required_fields():
    task = Task(1, "Study Python", "Practise OOP", "high")
    assert task.task_id == 1
    assert task.title == "Study Python"
    assert task.description == "Practise OOP"
    assert task.priority == "High"
    assert task.status == "Pending"


def test_empty_title_is_rejected():
    with pytest.raises(ValueError):
        Task(1, " ", "Description")


def test_empty_description_is_rejected():
    with pytest.raises(ValueError):
        Task(1, "Title", " ")


def test_invalid_priority_is_rejected():
    with pytest.raises(ValueError):
        Task(1, "Title", "Description", "Urgent")


def test_mark_completed():
    task = Task(1, "Title", "Description")
    task.mark_completed()
    assert task.status == "Completed"


def test_update_description():
    task = Task(1, "Title", "Old description")
    task.update_description("New description")
    assert task.description == "New description"


def test_save_and_load(tmp_path):
    file_path = tmp_path / "tasks.json"
    original = [Task(1, "Title", "Description", "Low")]
    assert save_tasks(original, file_path) is True

    loaded = load_tasks(file_path)
    assert len(loaded) == 1
    assert loaded[0].title == "Title"


def test_missing_json_returns_empty_list(tmp_path, capsys):
    result = load_tasks(tmp_path / "missing.json")
    assert result == []
    assert "not found" in capsys.readouterr().out.lower()


def test_malformed_json_returns_empty_list(tmp_path, capsys):
    file_path = tmp_path / "broken.json"
    file_path.write_text("{ bad json", encoding="utf-8")
    result = load_tasks(file_path)
    assert result == []
    assert "malformed json" in capsys.readouterr().out.lower()


def test_json_with_invalid_task_record_returns_empty_list(tmp_path, capsys):
    file_path = tmp_path / "invalid_record.json"
    file_path.write_text(json.dumps([{"id": 1, "title": "Missing fields"}]), encoding="utf-8")
    result = load_tasks(file_path)
    assert result == []
    assert "invalid task data" in capsys.readouterr().out.lower()


def test_find_task_raises_for_missing_id(monkeypatch):
    import task_tracker_oop

    monkeypatch.setattr(task_tracker_oop, "tasks", [])
    with pytest.raises(TaskNotFoundError):
        find_task(404)
