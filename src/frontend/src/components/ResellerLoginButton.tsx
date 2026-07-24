import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const ADMIN_PRINCIPAL =
  "zti7n-dy7nm-ct6qz-jd5uc-4jqzk-2zdt4-apxdj-p546d-ocojs-wgpx6-yqe";

export default function ResellerLoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const currentPrincipal = identity?.getPrincipal().toString();
  const isAuthorizedAdmin =
    isAuthenticated && currentPrincipal === ADMIN_PRINCIPAL;
  const disabled = loginStatus === "logging-in";

  const getButtonText = () => {
    if (loginStatus === "logging-in") return "Signing in...";
    if (isAuthenticated) {
      return isAuthorizedAdmin ? "Admin Sign Out" : "Sign Out";
    }
    return "Sign In";
  };

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error("Login error:", error);
        if (error.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <button
      onClick={handleAuth}
      disabled={disabled}
      className={`px-4 py-2 rounded-full transition-all duration-300 font-medium text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
        isAuthenticated
          ? "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300"
          : "bg-black hover:bg-gray-800 text-white"
      } disabled:opacity-50 disabled:transform-none disabled:shadow-md`}
    >
      {disabled && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {getButtonText()}
    </button>
  );
}
