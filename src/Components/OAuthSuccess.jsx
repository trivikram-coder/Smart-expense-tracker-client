import { useEffect } from "react";

const OAuthSuccess = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const token = params.get("token");
    const userId = params.get("userId");

    if (token && userId) {
      // ✅ Store both
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);

      // optional: clean URL (remove token from URL)
      window.history.replaceState({}, document.title, "/oauth-success");

      // redirect
      window.location.href = "/dashboard";
    } else {
      // fallback if something fails
      window.location.href = "/login";
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-3 rounded-lg bg-white px-5 py-3 shadow-sm">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>

        <p className="text-sm font-medium text-gray-700">
          Signing you in…
        </p>
      </div>
    </div>
  );
};

export default OAuthSuccess;