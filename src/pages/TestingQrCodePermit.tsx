// src/pages/ViewPermit.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axiosInstance from "@/api/axios";
import axios from "axios";

interface User {
  id: string;
  studentId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface Permit {
  id: string;
  permitCode: string;
  status: string;
  expiresAt: string;
}

const ViewPermit: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permit, setPermit] = useState<Permit | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermit = async () => {
      if (!token) {
        setError("❌ No token provided");
        setLoading(false);
        return;
      }

      try {
        // POST to backend /view-permit (your controller expects body.token)
        const res = await axiosInstance.post(
          "/qr-code/view-permit",
          { token },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        setPermit(res.data.permit || null);
        setUser(res.data.user || null);
        setMessage(res.data.message || null);
      } catch (err: unknown) {
        console.error("fetchPermit error:", err);

        if (axios.isAxiosError(err)) {
          // Axios error: safe to access response, request, etc.
          const serverMsg =
            err.response?.data?.error || JSON.stringify(err.response?.data);
          setError(
            err.response
              ? `Server ${err.response.status}: ${serverMsg}`
              : err.message
          );
        } else if (err instanceof Error) {
          // Non-Axios error (regular JS Error)
          setError(err.message);
        } else {
          // Fallback for unexpected error type
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPermit();
  }, [token]);

  if (loading) return <p>Loading permit...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>✅ Exam Permit</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}

      {user && (
        <div>
          <p>
            <b>Student:</b> {user.firstName} {user.lastName} ({user.email})
          </p>
          {user.studentId && (
            <p>
              <b>Student ID:</b> {user.studentId}
            </p>
          )}
        </div>
      )}

      {permit && (
        <div>
          <p>
            <b>Permit Code:</b> {permit.permitCode}
          </p>
          <p>
            <b>Status:</b> {permit.status}
          </p>
          <p>
            <b>Expires At:</b> {new Date(permit.expiresAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default ViewPermit;
