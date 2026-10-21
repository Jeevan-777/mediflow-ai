import React, { useEffect, useState, useRef } from "react";
import "./PatientMessages.css";

/* ── Inline SVG Icons ─────────────────────────────────── */
const IconChat = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconAppointments = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M9 12h6M9 16h6" />
  </svg>
);

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconHeart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    <polyline points="2 13 5 13 7 9 9 17 11 13 14 13" strokeWidth="1.4" />
  </svg>
);

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

function PatientMessages({ onBackToDashboard, onNavigateAppointments, onNavigateProfile }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [unreadMap, setUnreadMap] = useState({});

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const currentUserId = parseInt(localStorage.getItem("user_id"), 10);
  const patientName = localStorage.getItem("name") || "Patient";

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessagesAndMarkRead(selectedConversation.appointment_id);
    } else {
      setMessages([]);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async (maintainSelectedId = null) => {
    try {
      setConversationsLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");

      const response = await fetch("http://127.0.0.1:8000/messages/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load conversations");
      }

      const convList = data.conversations || [];
      setConversations(convList);

      if (convList.length > 0) {
        const targetId = maintainSelectedId || (selectedConversation ? selectedConversation.appointment_id : convList[0].appointment_id);
        const match = convList.find((c) => c.appointment_id === targetId) || convList[0];
        setSelectedConversation(match);
      } else {
        setSelectedConversation(null);
      }

      checkUnreadCounts(convList);
    } catch (err) {
      console.error("Patient conversations error:", err);
      setError(err.message || "Unable to load conversations");
    } finally {
      setConversationsLoading(false);
    }
  };

  const checkUnreadCounts = async (convList) => {
    const token = localStorage.getItem("access_token");
    const counts = {};

    await Promise.all(
      convList.map(async (conv) => {
        try {
          const res = await fetch(`http://127.0.0.1:8000/messages/${conv.appointment_id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const history = await res.json();
            const list = history.messages || [];
            // Unread messages sent by doctor to current patient
            const unread = list.filter(
              (m) => m.receiver_user_id === currentUserId && (m.is_read === 0 || m.is_read === false)
            ).length;
            if (unread > 0) {
              counts[conv.appointment_id] = unread;
            }
          }
        } catch {
          // Ignore background unread check errors
        }
      })
    );

    setUnreadMap(counts);
  };

  const fetchMessagesAndMarkRead = async (appointmentId) => {
    try {
      setMessagesLoading(true);
      setActionError("");
      const token = localStorage.getItem("access_token");

      const response = await fetch(`http://127.0.0.1:8000/messages/${appointmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load message history");
      }

      setMessages(data.messages || []);

      // Call PATCH /messages/{appointment_id}/read to mark incoming doctor messages as read
      try {
        const readResponse = await fetch(`http://127.0.0.1:8000/messages/${appointmentId}/read`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (readResponse.ok) {
          setUnreadMap((prev) => {
            const next = { ...prev };
            delete next[appointmentId];
            return next;
          });
        }
      } catch (readErr) {
        console.error("Failed to mark messages as read:", readErr);
      }
    } catch (err) {
      console.error("Fetch message history error:", err);
      setActionError(err.message || "Failed to load messages");
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();

    const trimmed = messageText.trim();
    if (!trimmed || !selectedConversation || sending) {
      return;
    }

    try {
      setSending(true);
      setActionError("");
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `http://127.0.0.1:8000/messages/${selectedConversation.appointment_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: trimmed,
          }),
        }
      );

      const savedMessage = await response.json();

      if (!response.ok) {
        throw new Error(savedMessage.detail || "Failed to send message");
      }

      setMessages((prev) => [...prev, savedMessage]);
      setMessageText("");

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      // Re-fetch to ensure synchronization
      const historyRes = await fetch(
        `http://127.0.0.1:8000/messages/${selectedConversation.appointment_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setMessages(historyData.messages || []);
      }
    } catch (err) {
      console.error("Send message error:", err);
      setActionError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaInput = (e) => {
    setMessageText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const formatMessageDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatAppointmentDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAppointmentTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name) => {
    if (!name) return "Dr";
    return name
      .replace(/^Dr\.?\s*/i, "")
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="patient-messages-shell">
      {/* ── SIDEBAR ── */}
      <aside className="patient-messages-sidebar">
        <div className="patient-messages-brand">
          <div className="patient-messages-brand-circle">
            <span className="patient-messages-brand-icon"><IconHeart /></span>
          </div>
          <div className="patient-messages-brand-name">
            Medi<span>Flow</span> AI
          </div>
        </div>

        <nav className="patient-messages-nav">
          <button className="patient-messages-nav-item" onClick={onBackToDashboard}>
            <span className="patient-messages-nav-icon"><IconDashboard /></span>
            Dashboard
          </button>

          <button
            className="patient-messages-nav-item"
            onClick={onNavigateAppointments || onBackToDashboard}
          >
            <span className="patient-messages-nav-icon"><IconAppointments /></span>
            My Appointments
          </button>

          <button
            className="patient-messages-nav-item"
            onClick={onNavigateProfile || onBackToDashboard}
          >
            <span className="patient-messages-nav-icon"><IconUser /></span>
            Profile
          </button>

          <button className="patient-messages-nav-item active">
            <span className="patient-messages-nav-icon"><IconChat /></span>
            Messages
          </button>
        </nav>

        <div className="patient-messages-sidebar-deco" />
      </aside>

      {/* ── HEADER ── */}
      <header className="patient-messages-header">
        <div className="patient-messages-header-title">
          <span className="patient-messages-header-icon"><IconChat /></span>
          <span>Messages</span>
        </div>

        <button className="patient-messages-back-btn" onClick={onBackToDashboard}>
          <IconArrowLeft />
          Back to Dashboard
        </button>
      </header>

      {/* ── MAIN ── */}
      <main className="patient-messages-main">
        {actionError && (
          <div className="patient-action-error-banner">
            <span>{actionError}</span>
            <button onClick={() => setActionError("")}>×</button>
          </div>
        )}

        <div className="patient-chat-layout">
          {/* LEFT: DOCTORS & APPOINTMENT CONVERSATIONS */}
          <aside className="patient-conversations-panel">
            <div className="patient-conversations-header">
              <h2>My Doctors</h2>
              <span className="patient-conversations-count">{conversations.length}</span>
            </div>

            {conversationsLoading ? (
              <div className="patient-chat-loading">
                <div className="patient-chat-spinner"></div>
                <p>Loading conversations...</p>
              </div>
            ) : error ? (
              <div className="patient-chat-error">
                <p>{error}</p>
                <button className="patient-chat-retry-btn" onClick={() => fetchConversations()}>
                  Retry
                </button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="patient-chat-empty">
                <div className="patient-empty-icon">💬</div>
                <h3>No Conversations</h3>
                <p>You do not have any scheduled or completed appointments eligible for messaging.</p>
              </div>
            ) : (
              <div className="patient-conversations-list">
                {conversations.map((conv) => {
                  const isSelected = selectedConversation?.appointment_id === conv.appointment_id;
                  const unreadCount = unreadMap[conv.appointment_id] || 0;

                  return (
                    <button
                      key={conv.appointment_id}
                      className={`patient-conv-item ${isSelected ? "active" : ""}`}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <div className="patient-doctor-avatar">
                        {getInitials(conv.other_name)}
                      </div>

                      <div className="patient-conv-info">
                        <div className="patient-conv-top">
                          <span className="patient-conv-name">{conv.other_name}</span>
                          {unreadCount > 0 && (
                            <span className="patient-unread-badge" title={`${unreadCount} unread message(s)`}>
                              {unreadCount}
                            </span>
                          )}
                        </div>

                        <div className="patient-conv-meta">
                          <span className="patient-conv-date">
                            {formatAppointmentDate(conv.appointment_date)}
                          </span>
                          <span className={`patient-status-pill ${conv.status}`}>
                            {conv.status}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          {/* RIGHT: CHAT WINDOW */}
          <section className="patient-chat-window">
            {selectedConversation ? (
              <>
                {/* CHAT HEADER */}
                <div className="patient-chat-header">
                  <div className="patient-chat-header-doctor">
                    <div className="patient-chat-header-avatar">
                      {getInitials(selectedConversation.other_name)}
                    </div>
                    <div className="patient-chat-header-info">
                      <h3>{selectedConversation.other_name}</h3>
                      <div className="patient-chat-header-details">
                        <span>Appointment #{selectedConversation.appointment_id}</span>
                        <span className="patient-chat-dot">•</span>
                        <span>
                          {formatAppointmentDate(selectedConversation.appointment_date)} at{" "}
                          {formatAppointmentTime(selectedConversation.appointment_date)}
                        </span>
                        <span className="patient-chat-dot">•</span>
                        <span className={`patient-status-pill ${selectedConversation.status}`}>
                          {selectedConversation.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MESSAGES LIST */}
                <div className="patient-chat-messages">
                  {messagesLoading ? (
                    <div className="patient-chat-loading">
                      <div className="patient-chat-spinner"></div>
                      <p>Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="patient-chat-empty">
                      <div className="patient-empty-icon">✉️</div>
                      <h3>No messages yet</h3>
                      <p>Send a message to {selectedConversation.other_name} to start your conversation.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isPatientSender = msg.sender_user_id === currentUserId;

                      return (
                        <div
                          key={msg.id}
                          className={`patient-msg-row ${isPatientSender ? "patient" : "doctor"}`}
                        >
                          <span className="patient-msg-sender">
                            {isPatientSender ? patientName : selectedConversation.other_name}
                          </span>

                          <div className="patient-msg-bubble">{msg.message}</div>

                          <div className="patient-msg-footer">
                            <span>{formatMessageDate(msg.sent_at)}</span>
                            {isPatientSender && (
                              <span
                                className={`patient-read-indicator ${
                                  msg.is_read ? "read" : "sent"
                                }`}
                                title={msg.is_read ? "Read by doctor" : "Sent"}
                              >
                                {msg.is_read ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* INPUT AREA */}
                <div className="patient-chat-input-area">
                  <form className="patient-chat-input-form" onSubmit={handleSendMessage}>
                    <textarea
                      ref={textareaRef}
                      className="patient-chat-textarea"
                      placeholder="Type your message here... (Enter to send, Shift+Enter for new line)"
                      rows={1}
                      value={messageText}
                      onChange={handleTextareaInput}
                      onKeyDown={handleKeyDown}
                      disabled={sending}
                    />

                    <button
                      type="submit"
                      className="patient-chat-send-btn"
                      disabled={!messageText.trim() || sending}
                    >
                      {sending ? (
                        <span>Sending...</span>
                      ) : (
                        <>
                          <span>Send</span>
                          <span>➤</span>
                        </>
                      )}
                    </button>
                  </form>
                  <div className="patient-chat-hint">
                    Press <strong>Enter</strong> to send • <strong>Shift + Enter</strong> for a new line
                  </div>
                </div>
              </>
            ) : (
              <div className="patient-chat-empty">
                <div className="patient-empty-icon">👈</div>
                <h3>Select a Conversation</h3>
                <p>Choose an appointment from the list to view and send messages.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default PatientMessages;
