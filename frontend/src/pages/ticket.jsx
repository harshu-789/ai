import React from 'react'
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from "react-markdown";
import { api } from '../utils/api.jsx'

function TicketDetails() {

const {id} = useParams()
const [ticket,setTicket] = useState(null)
const [loading,setLoading] = useState(true)

const token = localStorage.getItem('token')

useEffect(()=>{
  const fetchTicket = async () =>{
    try {
       const { res, data } = await api(`/api/tickets/${id}`);

        console.log("RES:", res);
      console.log("DATA:", data);

     
      if(res.ok){
        setTicket(data.ticket)
      } else {
        alert(data.message || "Failed to fetch ticket");
        console.error("Failed to fetch ticket")
      }
    } catch (error) {
      console.error(error);
        alert("Something went wrong");
    } finally {
      setLoading(false)
    }
  }
  fetchTicket()
},[id])

if (loading)
    return <div className="text-center mt-10">Loading ticket details...</div>;
  if (!ticket) return <div className="text-center mt-10">Ticket not found</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Ticket Details</h2>

      <div className="card bg-gray-800 shadow p-4 space-y-4">
        <h3 className="text-xl font-semibold">{ticket.title}</h3>
        {/* <p>{ticket.description}</p> */}
        <div className="prose max-w-none">
  <ReactMarkdown>{ticket.description}</ReactMarkdown>
</div>


        {/* Conditionally render extended details */}
        {ticket.status && (
          <>
            <div className="divider">Metadata</div>
            <p>
              <strong>Status:</strong> {ticket.status}
            </p>
            {ticket.priority && (
              <p>
                <strong>Priority:</strong> {ticket.priority}
              </p>
            )}

            {ticket.relatedSkills?.length > 0 && (
              <p>
                <strong>Related Skills:</strong>{" "}
                {ticket.relatedSkills.join(", ")}
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
              <p>
                <strong>Assigned To:</strong> {ticket.assignedTo?.email}
              </p>
            )}

            {ticket.createdAt && (
              <p className="text-sm text-gray-500 mt-2">
                Created At: {new Date(ticket.createdAt).toLocaleString()}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default TicketDetails