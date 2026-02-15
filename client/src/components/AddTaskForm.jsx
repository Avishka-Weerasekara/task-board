import { useState } from "react";
import API from "../services/api";
import socket from "../services/socket";

const AddTaskForm = ({ boardId }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return;

    try {
      await API.post("/tasks", {
        title,
        description,
        boardId,
        listName: "To Do",
      });

      socket.emit("taskUpdated", { boardId });

      setTitle("");
      setDescription("");
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-lg rounded-xl p-6 max-w-lg mx-auto"
    >
      <h2 className="text-lg font-semibold mb-4 text-slate-700">
        Add New Task
      </h2>

      <input
        type="text"
        placeholder="Task Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-slate-300 p-2 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
      />

      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border border-slate-300 p-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-slate-400"
      />

      <button
        type="submit"
        className="w-full bg-slate-800 text-white py-2 rounded hover:bg-slate-700 transition"
      >
        Add Task
      </button>
    </form>
  );
};

export default AddTaskForm;
