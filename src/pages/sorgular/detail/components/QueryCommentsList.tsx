import React, { useState } from "react";
import { FaPaperPlane, FaUserCircle } from "react-icons/fa";

interface Comment {
  id: number;
  text: string;
  userName: string;
  createdAt: string;
}

interface Props {
  comments: Comment[];
  onAddComment: (text: string) => void;
}

export const QueryCommentsList: React.FC<Props> = ({ comments, onAddComment }) => {
  const [newComment, setNewComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(newComment);
    setNewComment("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <form onSubmit={handleSubmit} style={{ position: "relative" }}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Şərhinizi bura yazın..."
          style={{
            width: "100%",
            minHeight: "100px",
            padding: "1rem",
            paddingRight: "3rem",
            borderRadius: "0.5rem",
            border: "1px solid #e2e8f0",
            fontSize: "0.875rem",
            outline: "none",
            resize: "none",
            transition: "all 0.2s",
            background: "#fff"
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#2563eb";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <button
          type="submit"
          style={{
            position: "absolute",
            right: "1rem",
            bottom: "1rem",
            background: "#0f172a",
            color: "white",
            border: "none",
            padding: "0.5rem",
            borderRadius: "0.375rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <FaPaperPlane />
        </button>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {comments.map((comment) => (
          <div
            key={comment.id}
            style={{
              display: "flex",
              gap: "1rem",
              padding: "1rem",
              background: "#f8fafc",
              borderRadius: "0.5rem",
              border: "1px solid #f1f5f9"
            }}
          >
            <FaUserCircle style={{ fontSize: "2rem", color: "#cbd5e1" }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1e293b" }}>{comment.userName}</span>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  {new Date(comment.createdAt).toLocaleString("az-AZ")}
                </span>
              </div>
              <p style={{ fontSize: "0.875rem", color: "#475569", lineHeight: "1.5", whiteSpace: "pre-line" }}>
                {comment.text}
              </p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: "0.875rem" }}>
            Hələ heç bir şərh yazılmayıb.
          </p>
        )}
      </div>
    </div>
  );
};
