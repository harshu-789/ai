import React, { useCallback, useEffect, useState } from "react";
import { api } from "../utils/api.jsx";

function Admin() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ role: "", skills: "" });

  const fetchUsers = useCallback(async () => {
    try {
      const data = await api("/api/auth/users");
      const nextUsers = Array.isArray(data) ? data : [];

      setUsers(nextUsers);
      setFilteredUsers(nextUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
      setFilteredUsers([]);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      const data = await api("/api/tickets");
      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setTickets([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
      fetchTickets();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchTickets, fetchUsers]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    setFilteredUsers(
      users.filter((user) =>
        user.email?.toLowerCase().includes(value.toLowerCase()),
      ),
    );
  };

  const handleUpdate = async () => {
    if (!editingUser) return;

    try {
      await api(`/api/auth/users/${editingUser}/update`, {
        method: "PUT",
        body: JSON.stringify({
          role: formData.role,
          skills: formData.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
        }),
      });

      setEditingUser(null);
      fetchUsers();
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

      {filteredUsers.length > 0 ? (
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

      {tickets.length > 0 ? (
        tickets.map((ticket) => (
          <div key={ticket._id} className="bg-base-100 shadow p-4 rounded mb-4">
            <p>
              <strong>Title:</strong> {ticket.title}
            </p>
            <p>
              <strong>Priority:</strong> {ticket.priority || "medium"}
            </p>
            <p>
              <strong>Status:</strong> {ticket.status || "TODO"}
            </p>
            <p>
              <strong>Assigned To:</strong>{" "}
              {ticket.assignedTo?.email || "Unassigned"}
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
