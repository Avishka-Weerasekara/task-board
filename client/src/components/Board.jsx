import { useEffect, useState } from "react";
import API from "../services/api";
import socket from "../services/socket";
import "./Board.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faPen,
  faTrash,
  faSave
} from "@fortawesome/free-solid-svg-icons";

const BOARD_ID = "board1";
const columns = ["To Do", "Doing", "Done"];
const columnOrder = ["To Do", "Doing", "Done"];

/* ======================
   Task Item
====================== */
const TaskItem = ({ task, refresh }) => {
  const [editing, setEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(task.title);
  const [newDescription, setNewDescription] = useState(task.description);

  const moveTask = async (direction) => {
    const currentIndex = columnOrder.indexOf(task.listName);
    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= columnOrder.length) return;

    await API.put(`/tasks/${task._id}`, {
      listName: columnOrder[newIndex],
    });

    socket.emit("taskUpdated", { boardId: task.boardId });
    refresh();
  };

  const saveEdit = async () => {
    await API.put(`/tasks/${task._id}`, {
      title: newTitle,
      description: newDescription,
    });

    setEditing(false);
    socket.emit("taskUpdated", { boardId: task.boardId });
    refresh();
  };

  const deleteTask = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );
    if (!confirmDelete) return;

    await API.delete(`/tasks/${task._id}`);
    socket.emit("taskUpdated", { boardId: task.boardId });
    refresh();
  };

  return (
    <div className="task-card">
      {editing ? (
        <>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
        </>
      ) : (
        <>
          <h4>{task.title}</h4>
          <p>{task.description}</p>
        </>
      )}

      <div className="task-buttons">
        <button className="move-btn" onClick={() => moveTask(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>

        <button className="move-btn" onClick={() => moveTask(1)}>
          <FontAwesomeIcon icon={faArrowRight} />
        </button>

        {editing ? (
          <button className="save-btn" onClick={saveEdit}>
            <FontAwesomeIcon icon={faSave} /> Save
          </button>
        ) : (
          <button className="edit-btn" onClick={() => setEditing(true)}>
            <FontAwesomeIcon icon={faPen} /> Edit
          </button>
        )}

        <button className="delete-btn" onClick={deleteTask}>
          <FontAwesomeIcon icon={faTrash} /> Delete
        </button>
      </div>
    </div>
  );
};

/* ======================
   Main Board
====================== */
const Board = () => {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState("To Do");

  const fetchTasks = async () => {
    const res = await API.get(`/tasks/${BOARD_ID}`);
    setTasks(res.data);
  };

  const handleAddTask = async () => {
    if (!newTitle) return;

    await API.post("/tasks", {
      title: newTitle,
      description: newDescription,
      boardId: BOARD_ID,
      listName: newStatus,
    });

    socket.emit("taskUpdated", { boardId: BOARD_ID });
    fetchTasks();

    setNewTitle("");
    setNewDescription("");
    setNewStatus("To Do");
  };

  useEffect(() => {
    socket.emit("joinBoard", BOARD_ID);
    fetchTasks();
    socket.on("taskUpdated", fetchTasks);
    return () => socket.off("taskUpdated");
  }, []);

  return (
    <>
      <div className="board-header">Task Board</div>

      <div className="entry-row">
        <input
          type="text"
          placeholder="Task Title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />

        <input
          type="text"
          placeholder="Description"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />

        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
        >
          <option value="To Do">To Do</option>
          <option value="Doing">Doing</option>
          <option value="Done">Done</option>
        </select>

        <button onClick={handleAddTask}>Add</button>
      </div>

      <div className="board-container">
        <table className="task-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr>
              {columns.map((col) => (
                <td key={col}>
                  {tasks
                    .filter((task) => task.listName === col)
                    .map((task) => (
                      <TaskItem
                        key={task._id}
                        task={task}
                        refresh={fetchTasks}
                      />
                    ))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Board;
