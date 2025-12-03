'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface College {
  id: string;
  name: string;
  location: string;
}

interface CollegeSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectCollege: (college: College) => void;
  placeholder?: string;
}

export function CollegeSearchInput({
  value,
  onChange,
  onSelectCollege,
  placeholder = 'Search for your college...',
}: CollegeSearchInputProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<College[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchColleges = async () => {
      if (value.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/colleges/search?q=${encodeURIComponent(value)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.colleges || []);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Error searching colleges:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchColleges, 300);
    return () => clearTimeout(debounceTimer);
  }, [value]);

  const handleSelectCollege = (college: College) => {
    onChange(college.name);
    onSelectCollege(college);
    setShowResults(false);
    setResults([]);
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true);
            }
          }}
        />
      </div>

      {showResults && results.length > 0 && (
        <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto shadow-lg">
          <div className="py-1">
            {results.map((college) => (
              <button
                key={college.id}
                onClick={() => handleSelectCollege(college)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium">{college.name}</div>
                <div className="text-sm text-gray-500">{college.location}</div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}

      {showResults && value.length >= 2 && results.length === 0 && !isSearching && (
        <Card className="absolute z-10 w-full mt-1 shadow-lg">
          <div className="px-4 py-3 text-sm text-gray-500">
            No colleges found. Try a different search term.
          </div>
        </Card>
      )}
    </div>
  );
}
