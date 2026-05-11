"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FixScoresButtonProps {
  evaluationId: string;
  currentScore: number;
  onScoreUpdated?: (newScore: number) => void;
}

export default function FixScoresButton({ 
  evaluationId, 
  currentScore, 
  onScoreUpdated 
}: FixScoresButtonProps) {
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);

  // Only show the button if the score is suspiciously low (likely has the issue)
  const shouldShowButton = currentScore < 25;

  if (!shouldShowButton) {
    return null;
  }

  const handleFixScores = async () => {
    setIsFixing(true);
    
    try {
      const response = await fetch('/api/debug/fix-specific-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluationId: evaluationId,
          forceReEvaluate: false
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newScore = data.improvements?.newScore || currentScore;
        const improvement = newScore - currentScore;
        
        setIsFixed(true);
        toast.success(
          `Interview scores fixed! Score improved from ${currentScore} to ${newScore} (+${improvement} points)`,
          { duration: 5000 }
        );
        
        if (onScoreUpdated) {
          onScoreUpdated(newScore);
        }
        
        // Refresh the page after a short delay to show updated scores
        setTimeout(() => {
          localStorage.setItem('scoresJustFixed', 'true');
          window.location.reload();
        }, 2000);
        
      } else {
        toast.error(data.error || 'Failed to fix scores');
      }
    } catch (error) {
      console.error('Error fixing scores:', error);
      toast.error('Network error while fixing scores');
    } finally {
      setIsFixing(false);
    }
  };

  if (isFixed) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
        <span className="text-green-600">✅</span>
        <span className="font-medium">Scores Fixed! Refreshing...</span>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <span className="text-yellow-600 text-xl">⚠️</span>
        <div className="flex-1">
          <h4 className="font-semibold text-yellow-800 mb-1">
            Low Score Detected
          </h4>
          <p className="text-yellow-700 text-sm mb-3">
            Your score appears unusually low (${currentScore}/100). This might be due to a technical issue 
            where your responses weren't properly captured during evaluation. We can re-evaluate your 
            interview with our enhanced processing system.
          </p>
          <Button
            onClick={handleFixScores}
            disabled={isFixing}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
            size="sm"
          >
            {isFixing ? (
              <>
                <span className="animate-spin mr-2">🔄</span>
                Fixing Scores...
              </>
            ) : (
              <>
                <span className="mr-2">🔧</span>
                Fix My Scores
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}