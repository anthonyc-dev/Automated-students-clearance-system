import axiosInstance from "@/api/axios";
import { message } from "antd";

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || defaultMessage;
  }
  return defaultMessage;
};

export interface SendSmsDto {
  phoneNumber: string;
  message: string;
}

export interface SendBulkSmsDto {
  phoneNumbers: string[];
  message: string;
}

export const sendSms = async (data: SendSmsDto): Promise<SendSmsDto | null> => {
  try {
    const response = await axiosInstance.post(`/sms/send-sms`, data);
    message.success("SMS sent successfully");
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error, "Failed to send SMS");
    message.error(errorMessage);
    console.error("Send SMS error:", error);
    return null;
  }
};

/**
 * Send SMS to multiple recipients
 * @param phoneNumbers - Array of phone numbers to send SMS to
 * @param messageText - The SMS message content
 * @returns Object with success count and failed phone numbers
 */
export const sendBulkSms = async (
  phoneNumbers: string[],
  messageText: string
): Promise<{ successCount: number; failedNumbers: string[] }> => {
  let successCount = 0;
  const failedNumbers: string[] = [];

  // Send SMS to each phone number
  for (const phoneNumber of phoneNumbers) {
    try {
      await axiosInstance.post(`/sms/send-sms`, {
        phoneNumber,
        message: messageText,
      });
      successCount++;
    } catch (error: unknown) {
      console.error(`Failed to send SMS to ${phoneNumber}:`, error);
      failedNumbers.push(phoneNumber);
    }
  }

  // Show appropriate message based on results
  if (successCount > 0 && failedNumbers.length === 0) {
    message.success(`SMS sent to ${successCount} student(s) successfully`);
  } else if (successCount > 0 && failedNumbers.length > 0) {
    message.warning(
      `SMS sent to ${successCount} student(s). Failed to send to ${failedNumbers.length} student(s).`
    );
  } else if (failedNumbers.length > 0) {
    message.error(
      `Failed to send SMS to all ${failedNumbers.length} student(s)`
    );
  }

  return { successCount, failedNumbers };
};
