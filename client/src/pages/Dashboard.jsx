import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faUserGroup, faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons";
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

    const handleCardClick = (type) => {
        if (type === "personal") {
            navigate(`/board/personal`);
        } else {
            navigate(`/board/room-main`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
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
                    <h2>Room Task Manager</h2>
                    <p>Collaborate with others on shared projects and assignments.</p>
                </div>
            </div>

            <button className="dashboard-logout" onClick={handleLogout}>
                <FontAwesomeIcon icon={faArrowRightFromBracket} /> Logout
            </button>
        </div>
    );
};

export default Dashboard;
