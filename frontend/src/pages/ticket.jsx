import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { api } from "../utils/api.jsx";

function TicketDetails() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const data = await api(`/api/tickets/${id}`);  // FIXED ROUTE
        setTicket(data.ticket);
      } catch (error) {
        alert("Failed to fetch ticket details");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  if (loading) return <div className="text-center mt-10">Loading ticket...</div>;
  if (!ticket) return <div className="text-center mt-10">Ticket not found</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Ticket Details</h2>

      <div className="card bg-gray-800 shadow p-4 space-y-4">
        <h3 className="text-xl font-semibold">{ticket.title}</h3>

        <div className="prose max-w-none">
          <ReactMarkdown>{ticket.description}</ReactMarkdown>
        </div>

        {/* Metadata Section */}
        <div className="divider">Metadata</div>

        <p><strong>Status:</strong> {ticket.status}</p>

        {ticket.priority && (
          <p><strong>Priority:</strong> {ticket.priority}</p>
        )}

        {ticket.relatedSkills?.length > 0 && (
          <p>
            <strong>Related Skills:</strong> {ticket.relatedSkills.join(", ")}
          </p>
        )}

        {ticket.helpfulNotes && (
          <div>
            <strong>Helpful Notes:</strong>
            <div className="prose max-w-none rounded mt-2">
              <ReactMarkdown>{ticket.helpfulNotes}</ReactMarkdown>
            </div>
          </div>
        )}

        {ticket.assignedTo && (
          <p><strong>Assigned To:</strong> {ticket.assignedTo.email}</p>
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
