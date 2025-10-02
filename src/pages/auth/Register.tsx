import { useAuth } from "@/authentication/useAuth";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type RegisterData, registerSchema } from "@/lib/validation";
import { passwordRules } from "@/lib/passwordRules";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import FormInput from "@/components/myUi/auth/FormInput";
import NdaAgreement from "@/components/myUi/auth/NdaAgreement";
import AuthButton from "@/components/myUi/auth/AuthButton";
import StatusModal from "@/components/myUi/auth/StatusModal";

export default function Register() {
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] =
    useState<boolean>(false);

  const navigate = useNavigate();
  const { registerUser, role } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true);
    setError("");
    try {
      await registerUser(
        data.studentId,
        data.firstName,
        data.lastName,
        data.email,
        data.phoneNumber,
        data.password
      );
      setIsSuccessModalVisible(true);
      reset();
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number; data?: { error?: string } };
        request?: unknown;
      };
      if (axiosError.response) {
        const { status } = axiosError.response;
        if (status === 400) {
          setError(
            axiosError.response.data?.error ||
              "Registration failed. Please try again later."
          );
        } else {
          setError("Registration failed. Please try again later.");
        }
      } else if (axiosError.request) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordValue = watch("password");

  return (
    <div className="min-h-screen flex">
      {/* Left side: Image */}
      <div className="hidden lg:flex flex-1 max-h-screen items-center justify-center bg-gray-900">
        <img
          src="https://ncmc.edu.ph/img/home_cover.jpg"
          alt="Register illustration"
          className="object-cover w-full h-full max-h-screen opacity-80"
          style={{ filter: "brightness(0.6)" }}
        />
      </div>
      {/* Right side: Register form */}
      <div className="flex flex-col justify-center flex-1 px-6 py-12 bg-white">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className=" text-center text-3xl font-bold tracking-tight text-gray-700">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your information to get started
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-3"
            noValidate
          >
            <div className="flex justify-between gap-4">
              <FormInput
                id="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="John"
                register={register}
                label="First Name"
                error={errors.firstName}
              />

              <FormInput
                id="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Doe"
                register={register}
                label="Last Name"
                error={errors.lastName}
              />
            </div>
            <div className="flex justify-between gap-4">
              <FormInput
                id="studentId"
                type="text"
                autoComplete="off"
                placeholder="00-0000"
                register={register}
                label="Student ID"
                error={errors.studentId}
              />

              <FormInput
                id="phoneNumber"
                type="text"
                autoComplete="tel"
                placeholder="123456789"
                register={register}
                label="Phone Number"
                error={errors.phoneNumber}
              />
            </div>

            <FormInput
              id="email"
              type="email"
              autoComplete="email"
              placeholder="john@example.com"
              register={register}
              label="Email address"
              error={errors.email}
            />

            <FormInput
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Create password"
              register={register}
              label="Password"
              error={errors.password}
            />

            {passwordValue && (
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {passwordRules.map((rule, idx) => {
                  const isValid = rule.test(passwordValue);
                  return (
                    <li key={idx} className="flex items-center gap-2">
                      {isValid ? (
                        <AiOutlineCheck className="text-green-600" />
                      ) : (
                        <AiOutlineClose className="text-red-600" />
                      )}
                      <span
                        className={isValid ? "text-green-700" : "text-red-700"}
                      >
                        {rule.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            <FormInput
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm password"
              register={register}
              label="Confirm Password"
              error={errors.confirmPassword}
            />

            <NdaAgreement
              register={register}
              errors={errors}
              label="I have read and agree to the"
              linkText="Non-Disclosure Agreement"
              linkUrl="https://ncmcmaranding.com/contact-us"
            />

            <AuthButton isLoading={isLoading} label="Create" type="submit" />
          </form>

          <div className="text-center text-xs sm:text-sm text-gray-600 mt-5">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-indigo-600 hover:underline hover:text-indigo-500 transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
      <StatusModal
        isOpen={isSuccessModalVisible}
        onOk={() => {
          setIsSuccessModalVisible(false);
          navigate("/login", { replace: true });
        }}
        role={role || ""}
        successTitle="Registration Successful"
        successMessage="Registration successful! You may now log in to your account."
        errorTitle="Access Denied"
        errorMessage="Students cannot access this login page. Please use the student portal."
      />
    </div>
  );
}
