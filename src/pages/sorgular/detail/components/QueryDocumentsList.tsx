import React from "react";
import { FaFileAlt, FaDownload, FaTrash, FaPlus } from "react-icons/fa";

interface Document {
  id: number;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  url: string;
}

interface Props {
  documents: Document[];
  onUpload: (file: File) => void;
  onDelete: (id: number) => void;
}

export const QueryDocumentsList: React.FC<Props> = ({ documents, onUpload, onDelete }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "#0f172a",
            color: "white",
            padding: "0.6rem 1rem",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          <FaPlus /> Sənəd əlavə et
          <input type="file" style={{ display: "none" }} onChange={handleFileChange} />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {documents.map((doc) => (
          <div
            key={doc.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1rem",
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "0.5rem",
              transition: "box-shadow 0.2s"
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "#f1f5f9",
                borderRadius: "0.375rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b"
              }}
            >
              <FaFileAlt style={{ fontSize: "1.25rem" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {doc.name}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>
                {formatSize(doc.size)} • {new Date(doc.createdAt).toLocaleDateString("az-AZ")}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.25rem" }}>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "0.5rem",
                  color: "#64748b",
                  borderRadius: "0.375rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                title="Yüklə"
              >
                <FaDownload />
              </a>
              <button
                onClick={() => onDelete(doc.id)}
                style={{
                  padding: "0.5rem",
                  color: "#ef4444",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                title="Sil"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
        {documents.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "3rem",
              background: "#f8fafc",
              border: "1px dashed #e2e8f0",
              borderRadius: "0.5rem",
              color: "#94a3b8"
            }}
          >
            Heç bir sənəd yüklənməyib.
          </div>
        )}
      </div>
    </div>
  );
};
