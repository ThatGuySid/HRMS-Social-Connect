import React from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { useState } from "react";

const Login = ({setAuthMode,setUser}) => {
  const [Loding, setLoding] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
    };
    setLoding(true);
    try {
      const response = await axios.post("http://localhost:5000/api/signIn", data, { withCredentials: true });
      if (response.data.success) {
       setUser(response.data.user)
      }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Something went wrong");
      }
    setLoding(false);
  };

  return (
    <div>
      <ToastContainer />
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Sign In
          </h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
          

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-end">
              <a
                href="#"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors"
              disabled={Loding}
            >
              {Loding ? "Loading..." : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?
            <div
            onClick={()=>{setAuthMode("regester")}}
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Sign up
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
