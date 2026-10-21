import React, { useEffect, useState, useRef } from "react";
import "./DoctorMessages.css";

function DoctorMessages() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  // Store unread counts per appointment_id { [appointment_id]: count }
  const [unreadMap, setUnreadMap] = useState({});

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const currentUserId = parseInt(localStorage.getItem("user_id"), 10);
  const doctorName = localStorage.getItem("name") || "Doctor";

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // 1. Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // 2. Fetch messages & mark read when selected conversation changes
  useEffect(() => {
    if (selectedConversation) {
      fetchMessagesAndMarkRead(selectedConversation.appointment_id);
    } else {
      setMessages([]);
    }
  }, [selectedConversation]);

  // 3. Scroll to bottom when messages update
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

      // Auto-select initial conversation or maintain existing
      if (convList.length > 0) {
        const targetId = maintainSelectedId || (selectedConversation ? selectedConversation.appointment_id : convList[0].appointment_id);
        const match = convList.find((c) => c.appointment_id === targetId) || convList[0];
        setSelectedConversation(match);
      } else {
        setSelectedConversation(null);
      }

      // Check unread count for conversations in background
      checkUnreadCounts(convList);
    } catch (err) {
      console.error("Doctor conversations error:", err);
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
            // Unread messages where doctor is receiver and is_read is 0/false
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

      // Retrieve messages history
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

      // Mark incoming messages as read
      try {
        const readResponse = await fetch(`http://127.0.0.1:8000/messages/${appointmentId}/read`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (readResponse.ok) {
          // Clear unread badge for this conversation
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

      // Append saved message immediately and clear input
      setMessages((prev) => [...prev, savedMessage]);
      setMessageText("");

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      // Re-fetch message history to guarantee full synchronization
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
    if (!name) return "P";
    return name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="doctor-messages-page">
      {/* HEADER */}
      <div className="doctor-messages-header">
        <div>
          <h1>Messages</h1>
          <p>Communicate directly with your patients regarding scheduled and completed appointments.</p>
        </div>
      </div>

      {/* ERROR BANNER IF ANY */}
      {actionError && (
        <div className="error-banner">
          <span>{actionError}</span>
          <button onClick={() => setActionError("")}>×</button>
        </div>
      )}

      {/* CHAT CONTAINER */}
      <div className="doctor-messages-layout">
        {/* LEFT: CONVERSATIONS PANEL */}
        <aside className="conversations-panel">
          <div className="conversations-panel-header">
            <h2>Conversations</h2>
            <span className="conversations-count">{conversations.length}</span>
          </div>

          {conversationsLoading ? (
            <div className="chat-loading-state">
              <div className="spinner"></div>
              <p>Loading conversations...</p>
            </div>
          ) : error ? (
            <div className="chat-error-state">
              <p>{error}</p>
              <button className="chat-retry-btn" onClick={() => fetchConversations()}>
                Retry
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="chat-empty-state">
              <div className="empty-state-icon">💬</div>
              <h3>No Conversations</h3>
              <p>You do not have any active patient appointments eligible for messaging.</p>
            </div>
          ) : (
            <div className="conversations-list">
              {conversations.map((conv) => {
                const isSelected = selectedConversation?.appointment_id === conv.appointment_id;
                const unreadCount = unreadMap[conv.appointment_id] || 0;

                return (
                  <button
                    key={conv.appointment_id}
                    className={`conversation-item ${isSelected ? "active" : ""}`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="patient-avatar-badge">
                      {getInitials(conv.other_name)}
                    </div>

                    <div className="conversation-info">
                      <div className="conversation-top-row">
                        <span className="conversation-patient-name">{conv.other_name}</span>
                        {unreadCount > 0 && (
                          <span className="unread-badge" title={`${unreadCount} unread message(s)`}>
                            {unreadCount}
                          </span>
                        )}
                      </div>

                      <div className="conversation-meta-row">
                        <span className="conversation-date">
                          {formatAppointmentDate(conv.appointment_date)}
                        </span>
                        <span className={`status-pill ${conv.status}`}>
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
        <section className="chat-window">
          {selectedConversation ? (
            <>
              {/* HEADER */}
              <div className="chat-header">
                <div className="chat-header-patient">
                  <div className="chat-header-avatar">
                    {getInitials(selectedConversation.other_name)}
                  </div>
                  <div className="chat-header-info">
                    <h3>{selectedConversation.other_name}</h3>
                    <div className="chat-header-details">
                      <span>Appointment #{selectedConversation.appointment_id}</span>
                      <span className="chat-header-dot">•</span>
                      <span>
                        {formatAppointmentDate(selectedConversation.appointment_date)} at{" "}
                        {formatAppointmentTime(selectedConversation.appointment_date)}
                      </span>
                      <span className="chat-header-dot">•</span>
                      <span className={`status-pill ${selectedConversation.status}`}>
                        {selectedConversation.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MESSAGES STREAM */}
              <div className="chat-messages-container">
                {messagesLoading ? (
                  <div className="chat-loading-state">
                    <div className="spinner"></div>
                    <p>Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-empty-state">
                    <div className="empty-state-icon">✉️</div>
                    <h3>No messages yet</h3>
                    <p>
                      Start the conversation with {selectedConversation.other_name} by typing a message below.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    // Check if sender is current user (doctor)
                    const isDoctorSender = msg.sender_user_id === currentUserId;

                    return (
                      <div
                        key={msg.id}
                        className={`message-row ${isDoctorSender ? "doctor" : "patient"}`}
                      >
                        <span className="message-sender-name">
                          {isDoctorSender ? `Dr. ${doctorName}` : selectedConversation.other_name}
                        </span>

                        <div className="message-bubble">{msg.message}</div>

                        <div className="message-footer">
                          <span>{formatMessageDate(msg.sent_at)}</span>
                          {isDoctorSender && (
                            <span
                              className={`read-status-indicator ${
                                msg.is_read ? "read" : "sent"
                              }`}
                              title={msg.is_read ? "Read by patient" : "Sent"}
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
              <div className="chat-input-area">
                <form className="chat-input-form" onSubmit={handleSendMessage}>
                  <textarea
                    ref={textareaRef}
                    className="chat-textarea"
                    placeholder="Type your message here... (Enter to send, Shift+Enter for new line)"
                    rows={1}
                    value={messageText}
                    onChange={handleTextareaInput}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                  />

                  <button
                    type="submit"
                    className="chat-send-btn"
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
                <div className="chat-input-hint">
                  Press <strong>Enter</strong> to send • <strong>Shift + Enter</strong> for a new line
                </div>
              </div>
            </>
          ) : (
            <div className="chat-empty-state">
              <div className="empty-state-icon">👈</div>
              <h3>Select a Conversation</h3>
              <p>Choose an appointment from the left sidebar to view messages.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default DoctorMessages;
