import { useAuth } from "@/authentication/useAuth";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginData } from "@/lib/validation";
import FormInput from "@/components/myUi/auth/FormInput";
import AuthButton from "@/components/myUi/auth/AuthButton";
import StatusModal from "@/components/myUi/auth/StatusModal";
import { message } from "antd";

export default function Login() {
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] =
    useState<boolean>(false);

  const { login, role, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  console.log("Im from Log in page", user?.phoneNumber);

  // Redirect or show modal based on role if already authenticated
  useEffect(() => {
    if (!isAuthenticated || !role) return;

    if (role === "student") {
      // Stay on login page and show modal
      setIsSuccessModalVisible(true);
      return;
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
      message.success("Login successfully!");
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
      <div className="hidden lg:flex flex-1 items-center justify-center relative bg-gradient-to-br from-indigo-100 via-white to-indigo-50 p-12 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-indigo-300 opacity-30 blur-3xl rounded-full animate-pulse-slow"></div>
        <div className="absolute -bottom-32 -right-24 w-[300px] h-[300px] bg-pink-200 opacity-20 blur-2xl rounded-full animate-pulse-slow"></div>
        <img
          src="/sign/test1.png"
          alt="Login illustration"
          className="relative rounded-3xl shadow-2xl object-contain max-w-[85%] max-h-[85%] transition-transform duration-500 hover:scale-105 hover:rotate-1"
          loading="lazy"
        />
      </div>
      {/* Right side: Login form */}
      <div className="flex flex-col justify-center flex-1 px-6 py-12 bg-white">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className=" text-center text-3xl font-bold tracking-tight text-gray-700">
            Welcome back!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Log in to continue
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
              to="https://www.facebook.com/MicroFluxOfficialPage"
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
          if (role === "admin") {
            navigate("/admin-side", { replace: true });
          } else if (
            role === "clearingOfficer" ||
            role === "sao" ||
            role === "registrar" ||
            role === "cashier" ||
            role === "laboratory" ||
            role === "library" ||
            role === "tailoring" ||
            role === "guidance" ||
            role === "dean"
          ) {
            navigate("/clearing-officer", { replace: true });
          } else if (role === "student") {
            navigate("/", { replace: true });
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
