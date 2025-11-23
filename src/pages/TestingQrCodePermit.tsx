// src/pages/ViewPermit.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axiosInstance from "@/api/axios";
import axios from "axios";
import {
  CheckCircle,
  XCircle,
  Calendar,
  Hash,
  User,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
} from "lucide-react";

interface Student {
  id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  program: string;
  yearLevel: string;
  profileImage?: string;
}

interface Permit {
  id: string;
  userId: string;
  studentId: string;
  permitCode: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  student: Student;
}

interface ResponseData {
  message: string;
  permit: Permit;
}

const ViewPermit: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ResponseData | null>(null);

  useEffect(() => {
    const fetchPermit = async () => {
      if (!token) {
        setError("❌ No token provided");
        setLoading(false);
        return;
      }

      try {
        const res = await axiosInstance.post(
          "/qr-code/view-permit",
          { token },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        setData(res.data);
      } catch (err: unknown) {
        console.error("fetchPermit error:", err);

        if (axios.isAxiosError(err)) {
          const serverMsg =
            err.response?.data?.error || JSON.stringify(err.response?.data);
          setError(
            err.response
              ? `Server ${err.response.status}: ${serverMsg}`
              : err.message
          );
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPermit();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading permit...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border-2 border-red-200">
          <div className="text-center">
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Access Denied
            </h2>
            <p className="text-red-600 mb-6">{error}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                Please contact the administration office if you believe this is
                an error.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.permit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <p className="text-center text-gray-600">No permit data available</p>
        </div>
      </div>
    );
  }

  const { permit, message } = data;
  const student = permit.student;
  const isActive = permit.status === "active";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Message Banner */}
        {message && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3 shadow-md">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <p className="text-green-800 font-medium">{message}</p>
          </div>
        )}

        {/* Main Permit Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-indigo-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">Examination Permit</h1>
                <p className="text-indigo-100 text-sm">
                  Northern Cebu Maritime College
                </p>
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full font-semibold text-xs ${
                      isActive
                        ? "bg-green-400 text-green-900"
                        : "bg-red-400 text-red-900"
                    }`}
                  >
                    {isActive ? "✓ ACTIVE" : "✗ INACTIVE"}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <img
                  src="/ncmc-logo.png"
                  alt="NCMC Logo"
                  className="w-20 h-20 object-contain bg-white/10 rounded-full p-2 backdrop-blur-sm"
                />
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Student Information Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Student Information
              </h2>

              <div className="flex items-start gap-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                {/* Profile Image */}
                {/* {student.profileImage && (
                  <div className="flex-shrink-0">
                    <img
                      src={student.profileImage}
                      alt={`${student.firstName} ${student.lastName}`}
                      className="w-28 h-28 rounded-xl object-cover border-4 border-white shadow-lg"
                    />
                  </div>
                )} */}

                {/* Student Details Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Hash className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        School ID
                      </p>
                      <p className="text-base font-semibold text-gray-800">
                        {student.schoolId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Full Name
                      </p>
                      <p className="text-base font-semibold text-gray-800">
                        {student.firstName} {student.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Email
                      </p>
                      <p className="text-base font-semibold text-gray-800 break-all">
                        {student.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Phone Number
                      </p>
                      <p className="text-base font-semibold text-gray-800">
                        {student.phoneNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 md:col-span-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Program
                      </p>
                      <p className="text-base font-semibold text-gray-800">
                        {student.program}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Year Level
                      </p>
                      <p className="text-base font-semibold text-gray-800">
                        {student.yearLevel}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Permit Details Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
                Permit Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-indigo-100">
                  <div className="flex items-start gap-3">
                    <Hash className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Permit Code
                      </p>
                      <p className="text-lg font-bold text-gray-800">
                        {permit.permitCode}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Status
                      </p>
                      <p className="text-lg font-bold text-gray-800 capitalize">
                        {permit.status}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Issued On
                      </p>
                      <p className="text-base font-semibold text-gray-800">
                        {new Date(permit.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-5 border border-orange-100">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Expires On
                      </p>
                      <p className="text-base font-semibold text-gray-800">
                        {new Date(permit.expiresAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 text-center">
                  <span className="font-semibold">Important:</span> This permit
                  is only valid for the examination period. Please present this
                  permit to the exam proctor when requested.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPermit;
