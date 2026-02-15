import { useEffect, useState } from "react";
import API from "../services/api";
import socket from "../services/socket";
import "./Board.css";

const BOARD_ID = "board1";
const columns = ["To Do", "Doing", "Done"];
const columnOrder = ["To Do", "Doing", "Done"];

/* =========================
   ADD TASK FORM
========================= */
const AddTaskForm = ({ refresh }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return;

    await API.post("/tasks", {
      title,
      description,
      boardId: BOARD_ID,
      listName: "To Do",
    });

    socket.emit("taskUpdated", { boardId: BOARD_ID });
    refresh();

    setTitle("");
    setDescription("");
  };

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Task Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button type="submit">Add</button>
    </form>
  );
};

/* =========================
   TASK ITEM
========================= */
const TaskItem = ({ task, refresh }) => {
  const [editing, setEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(task.title);
  const [newDescription, setNewDescription] = useState(task.description);

  /* MOVE TASK */
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

  /* SAVE EDIT */
  const saveEdit = async () => {
    await API.put(`/tasks/${task._id}`, {
      title: newTitle,
      description: newDescription,
    });

    setEditing(false);
    socket.emit("taskUpdated", { boardId: task.boardId });
    refresh();
  };

  /* DELETE TASK */
  const deleteTask = async () => {
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
        <button onClick={() => moveTask(-1)}>◀</button>
        <button onClick={() => moveTask(1)}>▶</button>

        {editing ? (
          <button onClick={saveEdit}>Save</button>
        ) : (
          <button onClick={() => setEditing(true)}>Edit</button>
        )}

        <button onClick={deleteTask}>Delete</button>
      </div>
    </div>
  );
};

/* =========================
   MAIN BOARD
========================= */
const Board = () => {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    const res = await API.get(`/tasks/${BOARD_ID}`);
    setTasks(res.data);
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

      <AddTaskForm refresh={fetchTasks} />

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
