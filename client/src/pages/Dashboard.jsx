import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faUserGroup, faArrowRightFromBracket, faPlus, faUsersRectangle } from "@fortawesome/free-solid-svg-icons";
import API from "../services/api";
import "./Dashboard.css";

const Dashboard = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    let username = "";
    if (token) {
        try {
            const decoded = jwtDecode(token);
            username = decoded.username;
        } catch (e) {
            console.error(e);
        }
    }

    const [workspaces, setWorkspaces] = useState([]);
    const [joinRoomId, setJoinRoomId] = useState("");

    useEffect(() => {
        const fetchWorkspaces = async () => {
            try {
                const res = await API.get("/workspaces");
                setWorkspaces(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        if (token) fetchWorkspaces();
    }, [token]);

    const handleCreateRoom = async () => {
        try {
            const res = await API.post("/workspaces", { name: `${username}'s Workspace` });
            navigate(`/board/${res.data.roomId}`);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCardClick = (type) => {
        if (type === "personal") {
            navigate(`/board/personal`);
        } else {
            handleCreateRoom();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const handleJoinRoom = () => {
        if (!joinRoomId.trim()) return;
        navigate(`/board/${joinRoomId.trim()}`);
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Welcome, {username}</h1>
                <p>Select a workspace to continue</p>
            </div>

            <div className="dashboard-cards">
                <div className="dashboard-card" onClick={() => handleCardClick("personal")}>
                    <div className="card-icon">
                        <FontAwesomeIcon icon={faUser} />
                    </div>
                    <h2>Personal Task Manager</h2>
                    <p>Manage your own tasks and personal goals in a private space.</p>
                </div>
                <div className="dashboard-card" onClick={() => handleCardClick("room")}>
                    <div className="card-icon">
                        <FontAwesomeIcon icon={faUserGroup} />
                    </div>
                    <h2>Create Shared Workspace</h2>
                    <p>Generate a secure room and distribute links to collaborate.</p>
                </div>
            </div>

            <div className="join-workspace-section">
                <h3>Join Existing Workspace</h3>
                <div className="join-workspace-input-group">
                    <input
                        type="text"
                        placeholder="Enter Room ID (e.g., room-cbcf0bfb)"
                        value={joinRoomId}
                        onChange={(e) => setJoinRoomId(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                    />
                    <button onClick={handleJoinRoom}>Join</button>
                </div>
            </div>

            {workspaces.length > 0 && (
                <div className="shared-workspaces-section">
                    <h3>Your Shared Workspaces</h3>
                    <div className="workspace-list">
                        {workspaces.map((ws) => (
                            <div
                                key={ws._id}
                                className="workspace-list-item"
                                onClick={() => navigate(`/board/${ws.roomId}`)}
                            >
                                <FontAwesomeIcon icon={faUsersRectangle} className="ws-icon" />
                                <div className="ws-details">
                                    <h4>{ws.name}</h4>
                                    <span>ID: {ws.roomId}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button className="dashboard-logout" onClick={handleLogout}>
                <FontAwesomeIcon icon={faArrowRightFromBracket} /> Logout
            </button>
        </div>
    );
};

export default Dashboard;
