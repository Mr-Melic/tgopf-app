import React from "react";
import { Button } from "./ui/button";

interface AppErrorFallbackProps {
  error?: Error;
}

/**
 * App-level error fallback UI shown when a top-level render error occurs
 */
export default function AppErrorFallback({ error }: AppErrorFallbackProps) {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-black">
            Something went wrong
          </h1>
          <p className="text-gray-600">
            We encountered an unexpected error while loading the application.
          </p>
        </div>

        {error && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
            <p className="text-sm text-gray-700 font-mono break-words">
              {error.message || "Unknown error"}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleReload}
            className="w-full bg-black hover:bg-gray-800 text-white"
            size="lg"
          >
            Reload Page
          </Button>

          <p className="text-sm text-gray-500">
            If the problem persists, please try clearing your browser cache or
            contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
