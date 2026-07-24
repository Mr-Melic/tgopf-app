import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function AmbassadorLoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
          queryClient.invalidateQueries({ queryKey: ["currentUserRole"] });
          queryClient.refetchQueries({ queryKey: ["isCallerAdmin"] });
          queryClient.refetchQueries({ queryKey: ["currentUserRole"] });
        }, 500);
      } catch (error: unknown) {
        const err = error as Error;
        console.error("Login error:", err);
        if (err.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  if (isAuthenticated) {
    return (
      <button
        onClick={handleAuth}
        disabled={disabled}
        className="px-3 py-1.5 rounded-full transition-all duration-300 font-medium text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 disabled:opacity-50 disabled:hover:-translate-y-0 disabled:shadow-md"
      >
        Sign Out
      </button>
    );
  }

  return (
    <button
      onClick={handleAuth}
      disabled={disabled}
      data-ocid="super-experience-login-btn"
      className="px-3 py-2 rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 bg-black hover:bg-gray-800 text-white disabled:opacity-50 disabled:hover:-translate-y-0 disabled:shadow-md flex flex-col items-center leading-tight"
    >
      {disabled ? (
        <span className="flex items-center gap-1.5">
          <svg
            className="animate-spin h-3.5 w-3.5 text-current"
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
          <span className="text-xs font-medium">Signing in...</span>
        </span>
      ) : (
        <>
          <span className="text-sm font-semibold whitespace-nowrap">
            Super Experience
          </span>
          <span className="text-[10px] font-normal opacity-80 whitespace-nowrap">
            Login / Sign-up
          </span>
        </>
      )}
    </button>
  );
}
