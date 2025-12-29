import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Chat from "./components/Chat";
import CreatePost from "./components/CreatePost";
import Posts from "./components/Posts";
import Recognition from "./components/Recognition";
import Events from "./components/Events";
import Login from "./components/Login";
import Register from "./components/Register";
import axios from "axios";
// import "./App.css"; // Removed to avoid conflicts with Tailwind CSS

function App() {
  const [activeComponent, setActiveComponent] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login"); // "login" or "register"

  const loadUser = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/isvalidUser",
        { withCredentials: true }
      );
      if (response.data.success) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {}
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleRegister = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveComponent("dashboard");
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case "dashboard":
        return <Dashboard user={user} onLogout={handleLogout} />;
      case "chat":
        return <Chat user={user} />;
      case "create-post":
        return <CreatePost  user={user} />;
      case "posts":
        return <Posts user={user} />;
      case "leaderboard":
        return <Recognition />;
      case "events":
        return <Events />;
      default:
        return <Dashboard user={user} onLogout={handleLogout} />;
    }
  };

  // Show login/register if user is not authenticated
  if (!user) {
    if (authMode === "login") {
      return (
        <Login
          onLogin={handleLogin}
          setAuthMode={setAuthMode}
          setUser={setUser}
        />
      );
    } else {
      return <Register onRegister={handleRegister} setAuthMode={setAuthMode} />;
    }
  }

  // Show main app if user is authenticated
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="flex-shrink-0 w-64 bg-white shadow-lg">
        <Sidebar
          activeComponent={activeComponent}
          setActiveComponent={setActiveComponent}
          user={user}
          onLogout={handleLogout}
          setUser={setUser}
        />
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50">{renderComponent()}</div>
    </div>
  );
}

export default App;
