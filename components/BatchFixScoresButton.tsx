"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BatchFixScoresButtonProps {
  userId: string;
  lowScoreCount: number;
}

export default function BatchFixScoresButton({ 
  userId, 
  lowScoreCount 
}: BatchFixScoresButtonProps) {
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);

  // Only show the button if there are interviews with low scores
  if (lowScoreCount === 0) {
    return null;
  }

  const handleBatchFix = async () => {
    setIsFixing(true);
    
    try {
      const response = await fetch('/api/debug/batch-fix-interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: userId,
          maxFixes: 20,
          forceAll: false
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { summary } = data;
        
        setIsFixed(true);
        toast.success(
          `Fixed ${summary.successCount} interviews! Average improvement: +${Math.round(data.averageImprovement || 0)} points`,
          { duration: 5000 }
        );
        
        // Refresh the page after a short delay to show updated scores
        setTimeout(() => {
          localStorage.setItem('scoresJustFixed', 'true');
          window.location.reload();
        }, 2000);
        
      } else {
        toast.error(data.error || 'Failed to fix interviews');
      }
    } catch (error) {
      console.error('Error fixing interviews:', error);
      toast.error('Network error while fixing interviews');
    } finally {
      setIsFixing(false);
    }
  };

  if (isFixed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-green-600 text-xl">✅</span>
          <span className="font-medium text-green-800">
            Interviews Fixed! Refreshing page...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <span className="text-orange-600 text-xl">🔧</span>
        <div className="flex-1">
          <h4 className="font-semibold text-orange-800 mb-1">
            Fix Low Interview Scores
          </h4>
          <p className="text-orange-700 text-sm mb-3">
            We detected {lowScoreCount} interview{lowScoreCount > 1 ? 's' : ''} with unusually low scores. 
            This might be due to a technical issue where your responses weren't properly captured. 
            Click below to re-evaluate all your interviews with our enhanced system.
          </p>
          <Button
            onClick={handleBatchFix}
            disabled={isFixing}
            className="bg-orange-600 hover:bg-orange-700 text-white"
            size="sm"
          >
            {isFixing ? (
              <>
                <span className="animate-spin mr-2">🔄</span>
                Fixing All Interviews...
              </>
            ) : (
              <>
                <span className="mr-2">🚀</span>
                Fix All My Interviews ({lowScoreCount})
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}