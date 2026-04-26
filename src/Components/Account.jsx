import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {Link} from 'react-router-dom'
import { apiUrl } from "../services/api";
const Account = () => {
  const storedUserId = localStorage.getItem("userId"); // get logged-in user ID
  const token=localStorage.getItem("token")
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const[showModal,setShowModal]=useState(false)
  // Fetch user data
  useEffect(() => {
    if (!storedUserId) return setLoading(false);

    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/auth/user/${storedUserId}`,{
    
        });
        if (res.ok) {
          const data = await res.json();
          const resData=data.data
          setUser(resData);
          setFormData({ name: resData.name, email: resData.email });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error(err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [storedUserId]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Update user info
  const handleUpdate = async () => {
    const { name, email } = formData;

    // Basic validation
    if (!name.trim() || !email.trim()) {
      setError("Name and email cannot be empty");
      return;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError("Invalid email format");
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/auth/user/${storedUserId}`, {
      
        method: "PUT",
        headers: { "Content-Type": "application/json",
          "authorization":`Bearer ${token}`
         },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser.data);
        toast.success("Details updated successfully")
        setEditMode(false);
        setError("");
      } else {
        setError("Update failed");
      }
    } catch (err) {
      console.error(err);
      setError("Server error");
    }
  };

  // Logout user
  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("userId");
    localStorage.removeItem("token")
    toast.success("You logged out")
     // clear stored user
    setUser(null);
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  if (!user) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-md mx-auto mt-10">

        <h2 className="text-xl font-semibold mb-4">Account</h2>
        <p>You are not logged in.</p>
        <br />
      
        <Link to='/auth' className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition cursor-pointer m-5" style={{textDecoration:'none'}}>Please Login</Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-semibold mb-4 text-center">Account Info</h2>

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <div className="mb-2">
        <strong>Name:</strong>{" "}
        {editMode ? (
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="border border-gray-300 rounded px-2 py-1 w-full"
          />
        ) : (
          user.name
        )}
      </div>

      <div className="mb-2">
        <strong>Email:</strong>{" "}
        {editMode ? (
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="border border-gray-300 rounded px-2 py-1 w-full"
          />
        ) : (
          user.email
        )}
      </div>

      <div className="mb-2">
        <strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}
      </div>
       
      {editMode ? (
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleUpdate}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition cursor-pointer"
          >
            Save
          </button>
          <button
            onClick={() => {
              setEditMode(false);
              setFormData({ name: user.name, email: user.email });
              setError("");
            }}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setEditMode(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={()=>setShowModal(!showModal)}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      )}
      {/* Tailwind Modal */}
      {showModal && (
       <div className="fixed inset-0 bg-white/50 backdrop-blur-md flex items-center justify-center z-50">

          <div className="bg-white rounded-lg shadow-lg w-96">
            <div className="border-b px-6 py-3 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Confirm Delete
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-6 text-gray-700 ">
              Are you sure to logout ?
            </div>
            <div className="border-t px-6 py-3 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
