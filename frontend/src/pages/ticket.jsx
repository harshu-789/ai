import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router-dom";
import { api } from "../utils/api.jsx";

const priorityClass = {
  high: "badge-error",
  medium: "badge-warning",
  low: "badge-success",
};

function TicketDetails() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const data = await api(`/api/tickets/${id}`);
        setTicket(data.ticket);
      } catch (err) {
        alert(err.message || "Failed to fetch ticket details");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  if (loading) return <div className="text-center mt-10">Loading ticket...</div>;
  if (!ticket) return <div className="text-center mt-10">Ticket not found</div>;

  const priority = ticket.priority || "medium";

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Ticket Details</h2>

      <div className="card bg-gray-800 shadow p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-xl font-semibold">{ticket.title}</h3>
          <span className={`badge ${priorityClass[priority] || "badge-warning"}`}>
            {priority}
          </span>
        </div>

        {ticket.summary && (
          <div className="rounded bg-gray-900 p-3">
            <h4 className="font-semibold">AI Summary</h4>
            <p>{ticket.summary}</p>
          </div>
        )}

        <div className="prose max-w-none">
          <ReactMarkdown>{ticket.description}</ReactMarkdown>
        </div>

        <div className="divider">Metadata</div>

        <p>
          <strong>Status:</strong> {ticket.status || "TODO"}
        </p>

        {ticket.relatedSkills?.length > 0 && (
          <p>
            <strong>Related Skills:</strong> {ticket.relatedSkills.join(", ")}
          </p>
        )}

        {ticket.helpfulNotes && (
          <div>
            <strong>Moderator Notes:</strong>
            <div className="prose max-w-none rounded mt-2">
              <ReactMarkdown>{ticket.helpfulNotes}</ReactMarkdown>
            </div>
          </div>
        )}

        {ticket.suggestedReply && (
          <div className="rounded bg-gray-900 p-3">
            <h4 className="font-semibold">Suggested Reply</h4>
            <div className="prose max-w-none mt-2">
              <ReactMarkdown>{ticket.suggestedReply}</ReactMarkdown>
            </div>
          </div>
        )}

        {ticket.assignedTo && (
          <p>
            <strong>Assigned To:</strong> {ticket.assignedTo.email}
          </p>
        )}

        {ticket.createdAt && (
          <p className="text-sm text-gray-500 mt-2">
            Created At: {new Date(ticket.createdAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

export default TicketDetails;
