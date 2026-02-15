import { useNavigate } from "react-router-dom";
import "./Auth.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <h1>Welcome to Task Board</h1>

      <div className="home-buttons">
        <button onClick={() => navigate("/login")}>
          Login
        </button>

        <button onClick={() => navigate("/signup")}>
          Signup
        </button>
      </div>
    </div>
  );
};

export default Home;
