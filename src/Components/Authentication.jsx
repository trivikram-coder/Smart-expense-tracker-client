import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiUrl, emailUrl } from "../services/api";

const Authentication = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState("form"); // form | otp
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    otp: "",
  });
  const[isLoading,setIsLoading]=useState(false)
  const [showPassword, setShowPassword] = useState(false);
  useEffect(()=>{
    const token=localStorage.getItem("token")||""
    if(!token) return;
    fetch( `${apiUrl}/auth/user`,{
      headers:{
        "authorization": `Bearer ${token}`
      }
    })
    .then(res=>res.json())
    .then(data=>{
      localStorage.setItem("userId",data.user.id)
      
    })
  },[])
  // 🔹 Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Send OTP or Login/Register
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (isLogin) {
        // ---- LOGIN ----
        const res = await fetch(
          `${apiUrl}/auth/login`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
            }),
          }
        );
        const data = await res.json();
        if (res.status === 200) {
  localStorage.setItem("token", data.token);
  // 🔥 fetch user immediately using NEW token
  const userRes = await fetch(`${apiUrl}/auth/user`, {
    headers: {
      authorization: `Bearer ${data.token}`,
    },
  });

  const userData = await userRes.json();
  localStorage.setItem("userId", userData.user.id);

  toast.success("Login successful");
  window.location.href = "/dashboard"; // NO setTimeout
        } else {
          toast.error(data.message);
        }
      } else {
        // ---- REGISTER: STEP 1 → SEND OTP ----
        const res = await fetch(`${emailUrl}/otp/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email,
            appName:"Smart Expense Tracker",
            type:"signup"
           }),
        });
        const data = await res.json();

        if (res.ok) {
          toast.success("OTP sent to your email");
          setStep("otp"); // move to OTP screen
        } else toast.error(data.message);
      }
    } catch {
      toast.error(isLogin ? "Server error" : "Unable to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Verify OTP & Create User
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${emailUrl}/otp/verify-otp/${formData.email}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otp: formData.otp }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        // ---- REGISTER USER AFTER OTP VERIFIED ----
        const res1 = await fetch(
          `${apiUrl}/auth/register`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: formData.name,
              email: formData.email,
              password: formData.password,
            }),
          }
        );

        const data1 = await res1.json();
        if (res1.ok) {
          toast.success("Registration successful");
          localStorage.setItem("token", data1.token);
          setTimeout(() => (window.location.href = "/dashboard"), 1500);
        } else {
          toast.error(data1.message);
        }
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("OTP validation failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        {step === "form" ? (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center">
              {isLogin ? "Login" : "Register"}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {!isLogin && (
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              )}

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  {showPassword ? "🔒" : "👀"}
                </button>
              </div>

              {/* 🔹 Show "Forget Password" only when login */}
              {isLogin && (
                <div className="text-right">
                  <Link
                    to="/forget"
                    className="text-blue-500 text-sm hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition cursor-pointer"
              >
                {isLoading ? "Please wait..." : isLogin ? "Login" : "Send OTP"}
              </button>
            </form>

            <p className="text-center mt-4 text-gray-600 cursor-pointer">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                className="text-blue-500 hover:underline cursor-pointer"
                disabled={isLoading}
                onClick={() => {
                  setIsLogin(!isLogin);
                  setStep("form");
                }}
              >
                {isLogin ? "Register" : "Login"}
              </button>
              <br />
              <a
  href={`${apiUrl}/auth/google/login`}
  className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-[0.98]"
>
  {/* Google icon */}
  <svg
    className="h-4 w-4"
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.68 1.22 9.16 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.98c-.58 2.96-2.26 5.48-4.78 7.18l7.73 5.98c4.51-4.18 7.05-10.36 7.05-17.63z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.81l-7.73-5.98c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>

  <span>Continue with Google</span>
</a>

            </p>
          </>
        ) : (
          // 🔹 OTP Screen
          <>
            <h2 className="text-2xl font-bold mb-6 text-center">Verify OTP</h2>
            <form onSubmit={handleOtpVerify} className="flex flex-col gap-4">
              <input
                type="text"
                name="otp"
                placeholder="Enter OTP"
                value={formData.otp}
                onChange={handleChange}
                className="border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-green-500 text-white py-2 rounded hover:bg-green-600 transition cursor-pointer"
              >
                {isLoading ? "Please wait..." : "Verify OTP"}
              </button>
            </form>

            <p className="text-center mt-4 text-gray-600">
              Didn’t get OTP?{" "}
              <button
                className="text-blue-500 hover:underline"
                disabled={isLoading}
                onClick={() => handleSubmit(new Event("resend"))}
              >
                Resend
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Authentication;
