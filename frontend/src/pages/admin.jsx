import React, { useEffect, useState } from "react";

function Admin() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    role: "",
    skills: "",
  });

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:3000/api/auth/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      setUsers(Array.isArray(data) ? data : []);
      setFilteredUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
      setFilteredUsers([]);
    }
  };

  // Fetch all tickets
  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:3000/api/tickets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setTickets([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTickets();
  }, []);

  // Search users by email
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    const filtered = users.filter((u) =>
      u.email?.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredUsers(filtered);
  };

  // Update user role & skills
  const handleUpdate = async () => {
    if (!editingUser) return;

    try {
      const token = localStorage.getItem("token");

      await fetch(
        `http://localhost:3000/api/auth/users/${editingUser}/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role: formData.role,
            skills: formData.skills.split(",").map((s) => s.trim()),
          }),
        }
      );

      setEditingUser(null);
      fetchUsers(); // refresh list
    } catch (err) {
      console.error("Error updating user:", err);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Panel - Manage Users</h1>

      <input
        type="text"
        className="input input-bordered w-full mb-6"
        placeholder="Search by email"
        value={searchQuery}
        onChange={handleSearch}
      />

      {/* USERS LIST */}
      {Array.isArray(filteredUsers) && filteredUsers.length > 0 ? (
        filteredUsers.map((user) => (
          <div key={user._id} className="bg-base-100 shadow rounded p-4 mb-4">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Role:</strong> {user.role}
            </p>
            <p>
              <strong>Skills:</strong> {user.skills?.join(", ") || "None"}
            </p>

            {/* If this user is being edited */}
            {editingUser === user._id ? (
              <div className="mt-4 space-y-2">
                <select
                  className="select select-bordered w-full"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>

                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Comma-separated skills"
                  value={formData.skills}
                  onChange={(e) =>
                    setFormData({ ...formData, skills: e.target.value })
                  }
                />

                <div className="flex gap-3">
                  <button className="btn btn-success btn-sm" onClick={handleUpdate}>
                    Save
                  </button>
                  <button
                    className="btn btn-error btn-sm"
                    onClick={() => setEditingUser(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-sm btn-primary mt-3"
                onClick={() => {
                  setEditingUser(user._id);
                  setFormData({
                    role: user.role,
                    skills: user.skills?.join(", ") || "",
                  });
                }}
              >
                Edit User
              </button>
            )}
          </div>
        ))
      ) : (
        <p>No users found.</p>
      )}

      <hr className="my-10" />

      <h2 className="text-xl font-bold mb-4">Tickets Overview</h2>

      {Array.isArray(tickets) && tickets.length > 0 ? (
        tickets.map((t) => (
          <div key={t._id} className="bg-base-100 shadow p-4 rounded mb-4">
            <p>
              <strong>Title:</strong> {t.title}
            </p>
            <p>
              <strong>Status:</strong> {t.status}
            </p>
            <p>
              <strong>Assigned To:</strong>{" "}
              {t.assignedTo?.email || "Unassigned"}
            </p>
          </div>
        ))
      ) : (
        <p>No tickets found.</p>
      )}
    </div>
  );
}

export default Admin;
