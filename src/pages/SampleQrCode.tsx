// src/components/QRCodeGenerator.tsx

import React, { useState } from "react";
import axiosInstance from "@/api/axios";
import type { AxiosError } from "axios";
import axios from "axios";

interface Permit {
  id: string;
  userId: string;
  permitCode: string;
  expiresAt: string;
  status: string;
  createdAt: string;
}

interface QRResponse {
  message: string;
  permit: Permit;
  qrImage: string;
}

const SampleQrCode: React.FC = () => {
  const [data, setData] = useState<QRResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userId = "68873263511467aa98fc2ea8"; // You can make this dynamic if needed

  const handleGenerateQR = async () => {
    try {
      const response = await axiosInstance.post(
        `/qr-code/generate-qr/${userId}`,
        {} // POST body is empty
      );

      const json: QRResponse = response.data;
      setData(json);
      setError(null);
    } catch (error: unknown) {
      // Type guard to check if error is AxiosError
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string }>;
        setError(
          axiosError.response?.data?.error ||
            axiosError.message ||
            "Something went wrong"
        );
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong");
      }
    }
  };

  return (
    <div className="mx-auto max-w-md p-8">
      <h1 className="text-3xl font-bold">Signed for Clearance Cleared</h1>
      <button
        onClick={handleGenerateQR}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
      >
        Generate QR Code
      </button>

      {error && <p className="text-red-500">{error}</p>}

      {data && (
        <div className="mt-8">
          <h2 className="text-2xl">{data.message}</h2>

          <h3 className="text-2xl mt-4">QR Code:</h3>
          <img
            src={data.qrImage}
            alt="QR Code"
            width={200}
            height={200}
            className="border border-gray-300 rounded-md"
          />
        </div>
      )}
    </div>
  );
};

export default SampleQrCode;
