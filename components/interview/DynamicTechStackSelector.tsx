'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';

interface TechStack {
  id: string;
  name: string;
  category: string;
  icon: string;
  popularity: number;
  isFramework: boolean;
}

interface JobRole {
  id: string;
  title: string;
  category: string;
  primaryTechs: string[];
  secondaryTechs: string[];
  experienceLevels: string[];
}

interface DynamicTechStackSelectorProps {
  onTechStackChange: (techStacks: string[]) => void;
  selectedRole?: string;
  selectedLevel?: string;
  maxSelection?: number;
}

export default function DynamicTechStackSelector({
  onTechStackChange,
  selectedRole,
  selectedLevel = 'Mid-level',
  maxSelection = 5
}: DynamicTechStackSelectorProps) {
  const [techStacks, setTechStacks] = useState<Record<string, TechStack[]>>({});
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState<'manual' | 'dynamic'>('dynamic');
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [includeFrameworks, setIncludeFrameworks] = useState(true);
  const [includeLanguages, setIncludeLanguages] = useState(true);

  // Load initial data
  useEffect(() => {
    loadTechStacks();
    loadJobRoles();
  }, []);

  const generateDynamicTechStack = async () => {
    if (!selectedRole) return;
    
    setGenerating(true);
    try {
      const response = await fetch('/api/tech-stacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          level: selectedLevel,
          count: maxSelection,
          includeFrameworks,
          includeLanguages
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSelectedTechs(data.techStacks);
        onTechStackChange(data.techStacks);
      }
    } catch (error) {
      console.error('Failed to generate dynamic tech stack:', error);
    } finally {
      setGenerating(false);
    }
  };

  // Auto-generate when role or level changes in dynamic mode
  useEffect(() => {
    if (mode === 'dynamic' && selectedRole) {
      generateDynamicTechStack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole, selectedLevel, mode]);

  const loadTechStacks = async () => {
    try {
      const response = await fetch('/api/tech-stacks?action=categories');
      const data = await response.json();
      if (data.success) {
        setTechStacks(data.data);
      }
    } catch (error) {
      console.error('Failed to load tech stacks:', error);
    }
  };

  const loadJobRoles = async () => {
    try {
      const response = await fetch('/api/tech-stacks?action=roles');
      const data = await response.json();
      if (data.success) {
        setJobRoles(data.data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load job roles:', error);
      setLoading(false);
    }
  };

  const handleTechToggle = (techName: string) => {
    if (mode !== 'manual') return;
    
    const newSelection = selectedTechs.includes(techName)
      ? selectedTechs.filter(t => t !== techName)
      : selectedTechs.length < maxSelection
        ? [...selectedTechs, techName]
        : selectedTechs;
    
    setSelectedTechs(newSelection);
    onTechStackChange(newSelection);
  };

  const getFilteredTechs = () => {
    const allTechs = Object.values(techStacks).flat();
    return allTechs.filter(tech => {
      if (selectedCategory !== 'all' && tech.category !== selectedCategory) return false;
      if (!includeFrameworks && tech.isFramework) return false;
      if (!includeLanguages && tech.category === 'Language') return false;
      return true;
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading tech stacks...
        </CardContent>
      </Card>
    );
  }

  const categories = Object.keys(techStacks);
  const filteredTechs = getFilteredTechs();

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Tech Stack Selection Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button
              variant={mode === 'dynamic' ? 'default' : 'outline'}
              onClick={() => setMode('dynamic')}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Dynamic (AI-Generated)
            </Button>
            <Button
              variant={mode === 'manual' ? 'default' : 'outline'}
              onClick={() => setMode('manual')}
            >
              Manual Selection
            </Button>
          </div>

          {mode === 'dynamic' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                AI will automatically select relevant technologies based on the job role and experience level.
              </p>
              
              {selectedRole && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={generateDynamicTechStack}
                    disabled={generating}
                    size="sm"
                    variant="outline"
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Regenerate Tech Stack
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Selection Filters */}
      {mode === 'manual' && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="frameworks"
                  checked={includeFrameworks}
                  onCheckedChange={setIncludeFrameworks}
                />
                <label htmlFor="frameworks" className="text-sm font-medium">
                  Include Frameworks
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="languages"
                  checked={includeLanguages}
                  onCheckedChange={setIncludeLanguages}
                />
                <label htmlFor="languages" className="text-sm font-medium">
                  Include Languages
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Tech Stacks */}
      <Card>
        <CardHeader>
          <CardTitle>
            Selected Technologies ({selectedTechs.length}/{maxSelection})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedTechs.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedTechs.map(tech => (
                <Badge key={tech} variant="default" className="px-3 py-1">
                  {tech}
                  {mode === 'manual' && (
                    <button
                      onClick={() => handleTechToggle(tech)}
                      className="ml-2 text-xs hover:text-red-500"
                    >
                      ×
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              {mode === 'dynamic' 
                ? 'Select a job role to auto-generate tech stack'
                : 'Select technologies from the list below'
              }
            </p>
          )}
        </CardContent>
      </Card>

      {/* Available Tech Stacks (Manual Mode) */}
      {mode === 'manual' && (
        <Card>
          <CardHeader>
            <CardTitle>Available Technologies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {filteredTechs.map(tech => (
                <Button
                  key={tech.id}
                  variant={selectedTechs.includes(tech.name) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTechToggle(tech.name)}
                  disabled={!selectedTechs.includes(tech.name) && selectedTechs.length >= maxSelection}
                  className="justify-start"
                >
                  <span className="mr-2">{tech.icon}</span>
                  {tech.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Role Info (Dynamic Mode) */}
      {mode === 'dynamic' && selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle>Role-Based Tech Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Technologies automatically selected for <strong>{selectedRole}</strong> at <strong>{selectedLevel}</strong> level.
            </p>
            {generating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating optimal tech stack...
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}