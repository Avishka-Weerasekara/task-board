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
  faSave,
  faPowerOff,
  faUserPlus,
  faCopy
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
          <div className="task-content">
            <h4>{task.title}</h4>
            <div className="task-email">{task.userEmail}</div>
            <p>{task.description}</p>
          </div>
        )}

        <div className="task-buttons">
          {task.listName !== "To Do" && (
            <button className="move-btn" onClick={() => moveTask(-1)}>
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
          )}

          {task.listName !== "Done" && (
            <button className="move-btn" onClick={() => moveTask(1)}>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          )}

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
   Invite Modal
====================== */
const InviteModal = ({ onConfirm, onCancel }) => {
  const [email, setEmail] = useState("");
  const inviteLink = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied to clipboard!");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box invite-modal-box">
        <h3>Invite to Workspace</h3>
        <p>Enter the email address of the user you want to invite to this shared room.</p>
        <input
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="invite-email-input"
          autoFocus
        />
        <div className="modal-buttons">
          <button className="cancel-btn" onClick={onCancel}>Cancel</button>
          <button
            className="confirm-btn invite-confirm-btn"
            onClick={() => onConfirm(email)}
          >
            Send Invite
          </button>
        </div>

        <div className="invite-divider">
          <span>OR</span>
        </div>

        <div className="copy-link-section">
          <input type="text" readOnly value={inviteLink} className="copy-link-input" />
          <button onClick={handleCopyLink} className="copy-link-btn" title="Copy Link">
            <FontAwesomeIcon icon={faCopy} />
          </button>
        </div>
      </div>
    </div>
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

  const handleInvite = () => {
    const inviteLink = window.location.href;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied to clipboard!");
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState("To Do");
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Room details state
  const [roomName, setRoomName] = useState("");
  const [editingRoomName, setEditingRoomName] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [showDeleteRoomModal, setShowDeleteRoomModal] = useState(false);

  // Advanced socket state
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [cursors, setCursors] = useState({}); // { socketId: { username, x, y } }

  const socketRoom = boardId === "personal" ? `personal-${username}` : boardId;

  const handleInviteSubmit = (email) => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    // In a fully developed backend, this would make an API call like:
    // await API.post(`/rooms/${boardId}/invite`, { email });

    toast.success(`Invitation successfully sent to ${email}!`);
    setShowInviteModal(false);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(boardId);
    toast.success("Room ID copied to clipboard!");
  };

  const handleSaveRoomName = async () => {
    if (!newRoomName.trim()) return;
    try {
      await API.put(`/workspaces/${boardId}`, { name: newRoomName });
      setRoomName(newRoomName);
      setEditingRoomName(false);
      toast.success("Room name updated");
    } catch (err) {
      toast.error("Failed to update room name");
    }
  };

  const handleDeleteRoom = async () => {
    try {
      await API.delete(`/workspaces/${boardId}`);
      socket.emit("deleteRoom", { boardId: socketRoom });
      toast.success("Workspace deleted");
      navigate("/dashboard");
    } catch (err) {
      toast.error("Failed to delete workspace");
    }
  };

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

    socket.emit("joinBoard", { boardId: socketRoom, username });
    fetchTasks();

    // Listen for incoming socket events
    socket.on("taskUpdated", fetchTasks);

    // Fetch room details if it's a shared room
    if (boardId !== "personal") {
      const fetchRoom = async () => {
        try {
          const res = await API.get(`/workspaces/${boardId}`);
          setRoomName(res.data.name);
          setNewRoomName(res.data.name);
        } catch (err) {
          console.error(err);
        }
      };
      fetchRoom();
    } else {
      setRoomName("Private Personal Workspace");
    }

    socket.on("roomDeleted", () => {
      toast.error("This workspace has been deleted.");
      navigate("/dashboard");
    });

    socket.on("usersInBoard", (users) => {
      setOnlineUsers(users);
    });

    socket.on("userTyping", ({ username: typingUsername, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.includes(typingUsername) ? prev : [...prev, typingUsername];
        } else {
          return prev.filter(u => u !== typingUsername);
        }
      });
    });

    socket.on("userCursorMove", (cursorData) => {
      setCursors(prev => ({
        ...prev,
        [cursorData.socketId]: cursorData
      }));
    });

    // Capture and emit local cursor movement (throttle it slightly for performace if needed)
    let lastEmitTime = 0;
    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastEmitTime < 50) return; // 50ms throttle (20fps cursor updates)
      lastEmitTime = now;

      const xPos = (e.clientX / window.innerWidth) * 100;
      const yPos = (e.clientY / window.innerHeight) * 100;
      socket.emit("cursorMove", { boardId: socketRoom, username, x: xPos, y: yPos });
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      socket.off("taskUpdated");
      socket.off("roomDeleted");
      socket.off("usersInBoard");
      socket.off("userTyping");
      socket.off("userCursorMove");
      window.removeEventListener("mousemove", handleMouseMove);
      socket.emit("leaveBoard", { boardId: socketRoom });
    };
  }, [boardId, username]);

  return (
    <div className="board-page-wrapper">
      {/* 🔮 Live Cursor Rendering */}
      {Object.values(cursors).map((cursor) => {
        if (cursor.username === username) return null; // hide own remote cursor
        return (
          <motion.div
            key={cursor.socketId}
            className="live-cursor"
            animate={{ left: `${cursor.x}vw`, top: `${cursor.y}vh` }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            style={{ position: 'fixed', zIndex: 9999, pointerEvents: 'none' }}
          >
            <div className="cursor-pointer" />
            <div className="cursor-label">{cursor.username}</div>
          </motion.div>
        );
      })}

      <div className="board-header">
        <div className="header-left">
          <button className="back-btn" onClick={goToDashboard}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>

          {editingRoomName ? (
            <div className="edit-room-container">
              <input
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSaveRoomName()}
              />
              <button onClick={handleSaveRoomName} className="save-room-btn"><FontAwesomeIcon icon={faSave} /></button>
              <button onClick={() => setEditingRoomName(false)} className="cancel-room-btn">✕</button>
            </div>
          ) : (
            <div className="room-title-container">
              <h2>{roomName}</h2>
              {boardId !== "personal" && (
                <div className="room-actions">
                  <span className="room-id-badge" onClick={copyRoomId} title="Copy Room ID">
                    ID: {boardId} <FontAwesomeIcon icon={faCopy} />
                  </span>
                  <button className="edit-room-icon" onClick={() => setEditingRoomName(true)} title="Edit Room Name">
                    <FontAwesomeIcon icon={faPen} />
                  </button>
                  <button className="delete-room-icon" onClick={() => setShowDeleteRoomModal(true)} title="Delete Workspace">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="header-right">
          <div className="online-users-pill" title={onlineUsers.map(u => u.username).join(", ")}>
            <div className="pulse-dot"></div>
            {onlineUsers.length} Online
          </div>
          <span className="welcome-text">Welcome, {username}</span>
          {boardId !== "personal" && (
            <button onClick={() => setShowInviteModal(true)} className="invite-btn">
              <FontAwesomeIcon icon={faUserPlus} /> Invite
            </button>
          )}
          <button onClick={handleLogout} className="logout-btn">
            <FontAwesomeIcon icon={faPowerOff} /> Logout
          </button>
        </div>
      </div>

      {showInviteModal && (
        <InviteModal
          onConfirm={handleInviteSubmit}
          onCancel={() => setShowInviteModal(false)}
        />
      )}

      {showDeleteRoomModal && (
        <ConfirmModal
          message={`Are you sure you want to completely delete "${roomName}"? This cannot be undone.`}
          onConfirm={handleDeleteRoom}
          onCancel={() => setShowDeleteRoomModal(false)}
        />
      )}

      <div className="entry-row-container">
        <div className="entry-row">
          <input
            placeholder="Task Title"
            value={newTitle}
            onChange={(e) => {
              setNewTitle(e.target.value);
              socket.emit("typing", { boardId: socketRoom, username, isTyping: e.target.value.length > 0 });
            }}
            onBlur={() => socket.emit("typing", { boardId: socketRoom, username, isTyping: false })}
          />
          <input
            placeholder="Description"
            value={newDescription}
            onChange={(e) => {
              setNewDescription(e.target.value);
              socket.emit("typing", { boardId: socketRoom, username, isTyping: e.target.value.length > 0 });
            }}
            onBlur={() => socket.emit("typing", { boardId: socketRoom, username, isTyping: false })}
          />
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            <option>To Do</option>
            <option>Doing</option>
            <option>Done</option>
          </select>
          <button className="add-task-btn" onClick={handleAddTask}>Add Task</button>
        </div>
        {typingUsers.length > 0 && typingUsers.filter(u => u !== username).length > 0 && (
          <div className="typing-indicator">
            <span className="typing-dots"></span>
            {typingUsers.filter(u => u !== username).join(", ")} {typingUsers.filter(u => u !== username).length === 1 ? "is" : "are"} typing...
          </div>
        )}
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
    </div>
  );
};

export default Board;
