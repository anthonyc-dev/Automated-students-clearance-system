import { useAuth } from "@/authentication/useAuth";
import { redirectService } from "@/authentication/redirectService";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginData } from "@/lib/validation";
import FormInput from "@/components/myUi/auth/FormInput";
import AuthButton from "@/components/myUi/auth/AuthButton";
import StatusModal from "@/components/myUi/auth/StatusModal";

export default function Login() {
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] =
    useState<boolean>(false);

  const { login, role, user, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && role) {
      redirectService.redirectToDashboard(role);
    }
  }, [isAuthenticated, role]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    setError("");

    try {
      await login(data.email, data.password);

      setIsSuccessModalVisible(true);
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number; data?: { error?: string } };
        request?: unknown;
      };
      if (axiosError.response) {
        const { status } = axiosError.response;

        if (status === 401 || status === 404 || status === 400) {
          setError(
            axiosError.response.data?.error ||
              "Wrong credentials. Please try again."
          );
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

  return (
    <div className="min-h-screen flex">
      {/* Left side: Image */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-900">
        <img
          src="https://ncmc.edu.ph/img/home_cover.jpg"
          alt="Login illustration"
          className="object-cover w-full h-full max-h-screen opacity-80"
          style={{ filter: "brightness(0.6)" }}
        />
      </div>
      {/* Right side: Login form */}
      <div className="flex flex-col justify-center flex-1 px-6 py-12 bg-white">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className=" text-center text-3xl font-bold tracking-tight text-gray-700">
            Welcome back!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Log in to continue to your account
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
              autoComplete="current-password"
              placeholder="Enter your password"
              register={register}
              label="Password"
              error={errors.password}
            />

            <div className="text-sm my-5 flex justify-end">
              <a href="#" className=" text-indigo-600 hover:text-indigo-500">
                Forgot password?
              </a>
            </div>

            <AuthButton isLoading={isLoading} label="Log in" type="submit" />
          </form>

          <div className="text-center text-xs sm:text-sm text-gray-600 mt-5">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className=" text-indigo-600 hover:underline hover:text-indigo-500 transition"
            >
              Sign up here for free
            </Link>
          </div>

          <div className="text-center text-xs sm:text-sm text-gray-600 mt-5">
            Need help?{" "}
            <Link
              to="https://ncmcmaranding.com/contact-us"
              target="_blank"
              className="text-indigo-600 hover:underline hover:text-indigo-500 transition"
            >
              Contact us
            </Link>
          </div>
        </div>
      </div>
      <StatusModal
        isOpen={isSuccessModalVisible}
        onOk={() => {
          setIsSuccessModalVisible(false);
          if (role) {
            redirectService.redirectToDashboard(role);
          }
        }}
        role={role || ""}
        successTitle="Login Successful"
        successMessage={`Welcome back, ${user?.firstName}! NCMC's Clearance System is now open...`}
        errorTitle="Access Denied"
        errorMessage={
          error ||
          "Students cannot access this login page. Please use the student portal."
        }
      />
    </div>
  );
}
