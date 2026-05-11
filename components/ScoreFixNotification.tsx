"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ScoreFixNotification() {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Check if user just had scores fixed (from URL params or localStorage)
    const urlParams = new URLSearchParams(window.location.search);
    const scoreFixed = urlParams.get('scoreFixed') === 'true';
    const fixedFromStorage = localStorage.getItem('scoresJustFixed') === 'true';

    if (scoreFixed || fixedFromStorage) {
      setShowNotification(true);
      
      // Clean up
      if (scoreFixed) {
        // Remove from URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
      if (fixedFromStorage) {
        localStorage.removeItem('scoresJustFixed');
      }

      // Auto-hide after 10 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 10000);
    }
  }, []);

  if (!showNotification) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <span className="text-green-600 text-xl">🎉</span>
          <div className="flex-1">
            <h4 className="font-semibold text-green-800 mb-1">
              Scores Successfully Updated!
            </h4>
            <p className="text-green-700 text-sm mb-3">
              Your interview scores have been re-evaluated and updated to reflect your actual performance. 
              The "No response recorded" issue has been resolved.
            </p>
            <Button
              onClick={() => setShowNotification(false)}
              variant="outline"
              size="sm"
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              Got it!
            </Button>
          </div>
          <button
            onClick={() => setShowNotification(false)}
            className="text-green-600 hover:text-green-800"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}