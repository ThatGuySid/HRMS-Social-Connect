import { useState } from "react";
import { ToastContainer,toast } from "react-toastify";
import axios from "axios";

const Sidebar = ({ activeComponent, setActiveComponent, user, onLogout ,setUser }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [logoHovered, setLogoHovered] = useState(false);


  const handleSubmit = async () => {
      try {
      const response = await axios.get("http://localhost:5000/api/signOut", { withCredentials: true });
      if (response.data.success) {
       setUser(null)
      }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Something went wrong");
      }
  };





  const menuItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: "🏠",
    },
    {
      id: "chat",
      name: "Chat",
      icon: "💬",
    },
    {
      id: "create-post",
      name: "Create Post",
      icon: "➕",
    },
    {
      id: "posts",
      name: "Posts",
      icon: "📄",
    },
    {
      id: "leaderboard",
      name: "Recognition",
      icon: "🏆",
    },
    {
      id: "events",
      name: "Events",
      icon: "📅",
    },
  ];

  return (
    <div className="w-64 bg-white h-full border-r border-gray-200 shadow-sm flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div
          className="flex items-center space-x-3 cursor-pointer group"
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
        >
          <div
            className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center transition-all duration-200 ${
              logoHovered ? "scale-105 shadow-md" : ""
            }`}
          >
            <span className="text-white font-bold text-lg">H</span>
          </div>
          <div>
            <span
              className={`text-xl font-semibold text-gray-800 transition-colors duration-200 ${
                logoHovered ? "text-blue-600" : ""
              }`}
            >
              HRMS
            </span>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Human Resources</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-6">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveComponent(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                  activeComponent === item.id
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 border-l-4 border-blue-600 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                <span
                  className={`text-xl transition-all duration-200 ${
                    hoveredItem === item.id ? "scale-110" : ""
                  } ${
                    activeComponent === item.id
                      ? "text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-sm font-medium flex-1">{item.name}</span>

                {/* Active indicator */}
                {activeComponent === item.id && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-gray-100 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-gray-500">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-xs text-blue-600 font-semibold">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Administrator</p>
            </div>
          </div>
          <button
            onClick={()=>{handleSubmit()}}
            className="w-8 h-8 bg-gray-100 hover:bg-red-100 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-600 transition-colors"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 012 2v2h-2V4H4v16h10v-2h2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2h10z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
