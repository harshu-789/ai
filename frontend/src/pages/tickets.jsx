import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api.jsx";

const priorityClass = {
  high: "badge-error",
  medium: "badge-warning",
  low: "badge-success",
};

function Tickets() {
  const [form, setForm] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const fetchTickets = async () => {
    try {
      const data = await api("/api/tickets");
      setTickets(data.tickets || []);
    } catch (err) {
      alert(err.message || "Failed to load tickets");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api("/api/tickets", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setForm({ title: "", description: "" });
      fetchTickets();
    } catch (err) {
      alert(err.message || "Ticket creation failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Create Ticket</h2>

      <form onSubmit={handleSubmit} className="space-y-3 mb-8">
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Ticket Title"
          className="input input-bordered w-full"
          required
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Ticket Description"
          className="textarea textarea-bordered w-full min-h-32"
          required
        />

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Ticket"}
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-2">All Tickets</h2>

      <div className="space-y-3">
        {tickets.map((ticket) => {
          const priority = ticket.priority || "medium";

          return (
            <Link
              key={ticket._id}
              className="card shadow-md p-4 bg-gray-800"
              to={`/tickets/${ticket._id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="font-bold text-lg">{ticket.title}</h3>
                <span className={`badge ${priorityClass[priority] || "badge-warning"}`}>
                  {priority}
                </span>
              </div>

              <p className="text-sm mt-2 line-clamp-2">{ticket.description}</p>

              <p className="text-sm text-gray-300 mt-2">
                Status: {ticket.status || "TODO"}
              </p>

              {ticket.relatedSkills?.length > 0 && (
                <p className="text-sm text-green-300">
                  Related Skills: {ticket.relatedSkills.join(", ")}
                </p>
              )}

              {ticket.summary && (
                <p className="text-sm text-gray-300 truncate">
                  Summary: {ticket.summary}
                </p>
              )}

              {ticket.suggestedReply && (
                <p className="text-sm text-blue-200 truncate">
                  Suggested Reply: {ticket.suggestedReply}
                </p>
              )}

              {ticket.assignedTo && (
                <p className="text-sm text-blue-300">
                  Assigned To: {ticket.assignedTo.email}
                </p>
              )}

              <p className="text-sm text-gray-500">
                Created At: {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </Link>
          );
        })}

        {tickets.length === 0 && <p>No tickets submitted yet.</p>}
      </div>
    </div>
  );
}

export default Tickets;
