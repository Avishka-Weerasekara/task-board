import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import API from "../services/api";
import socket from "../services/socket";
import ConfirmModal from "./ConfirmModal";
import "./Board.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faPen,
  faTrash,
  faSave
} from "@fortawesome/free-solid-svg-icons";

// Dynamic boardId will be extracted via useParams
const columns = ["To Do", "Doing", "Done"];
const columnOrder = ["To Do", "Doing", "Done"];

/* ======================
   Task Item
====================== */
const TaskItem = ({ task, refresh, username }) => {
  const [editing, setEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState(task.title);
  const [newDescription, setNewDescription] = useState(task.description);

  const moveTask = async (direction) => {
    const currentIndex = columnOrder.indexOf(task.listName);
    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= columnOrder.length) return;

    await API.put(`/tasks/${task._id}`, {
      listName: columnOrder[newIndex],
      boardId: task.boardId,
    });

    toast.success("Task moved");
    const socketRoom = task.boardId === "personal" ? `personal-${username}` : task.boardId;
    socket.emit("taskUpdated", { boardId: socketRoom });
    refresh();
  };

  const saveEdit = async () => {
    await API.put(`/tasks/${task._id}`, {
      title: newTitle,
      description: newDescription,
      boardId: task.boardId,
    });

    toast.success("Task updated");
    setEditing(false);
    socket.emit("taskUpdated", { boardId: task.boardId });
    refresh();
  };

  const deleteTask = async () => {
    await API.delete(`/tasks/${task._id}?boardId=${task.boardId}`);
    toast.success("Task deleted");
    const socketRoom = task.boardId === "personal" ? `personal-${username}` : task.boardId;
    socket.emit("taskUpdated", { boardId: socketRoom });
    refresh();
    setShowModal(false);
  };

  return (
    <>
      <motion.div
        className="task-card"
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
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
            <div className="task-email">{task.userEmail}</div>
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

          <button
            className="delete-btn"
            onClick={() => setShowModal(true)}
          >
            <FontAwesomeIcon icon={faTrash} /> Delete
          </button>
        </div>
      </motion.div>

      {showModal && (
        <ConfirmModal
          message="Are you sure you want to delete this task?"
          onConfirm={deleteTask}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  );
};

/* ======================
   Board Component
====================== */
const Board = () => {
  const navigate = useNavigate();
  const { boardId } = useParams();

  const token = localStorage.getItem("token");

  let username = "";
  if (token) {
    const decoded = jwtDecode(token);
    username = decoded.username;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState("To Do");

  const fetchTasks = async () => {
    const res = await API.get(`/tasks/${boardId}`);
    setTasks(res.data);
  };

  const handleAddTask = async () => {
    if (!newTitle) return;

    await API.post("/tasks", {
      title: newTitle,
      description: newDescription,
      boardId: boardId,
      listName: newStatus,
    });

    toast.success("Task added");
    const socketRoom = boardId === "personal" ? `personal-${username}` : boardId;
    socket.emit("taskUpdated", { boardId: socketRoom });
    fetchTasks();

    setNewTitle("");
    setNewDescription("");
  };

  useEffect(() => {
    if (!username) return; // Wait until username is decoded
    const socketRoom = boardId === "personal" ? `personal-${username}` : boardId;
    socket.emit("joinBoard", socketRoom);
    fetchTasks();
    socket.on("taskUpdated", fetchTasks);
    return () => socket.off("taskUpdated");
  }, [boardId, username]);

  return (
    <>
      <div className="board-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="back-btn" onClick={goToDashboard} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
          <h2>{boardId === "personal" ? "Private Personal Workspace" : "Shared Room Workspace"}</h2>
        </div>

        <div className="header-right">
          <span>Welcome, {username}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="entry-row">
        <input
          placeholder="Task Title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <input
          placeholder="Description"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />
        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
        >
          <option>To Do</option>
          <option>Doing</option>
          <option>Done</option>
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
                  <AnimatePresence>
                    {tasks
                      .filter((task) => task.listName === col)
                      .map((task) => (
                        <TaskItem
                          key={task._id}
                          task={task}
                          refresh={fetchTasks}
                          username={username}
                        />
                      ))}
                  </AnimatePresence>
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
