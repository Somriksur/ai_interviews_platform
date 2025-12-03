"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, UserMinus, Search, Filter, Users } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  branch: string;
  year: number;
  cgpa: number;
}

interface TaggedStudent extends Student {
  tagId: string;
  taggedAt: any;
  notificationSent: boolean;
}

export default function DriveTagStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const collegeId = params.collegeId as string;
  const driveId = params.driveId as string;

  const [taggedStudents, setTaggedStudents] = useState<TaggedStudent[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [filteredAvailable, setFilteredAvailable] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagging, setTagging] = useState(false);

  // Selection state
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedTagged, setSelectedTagged] = useState<Set<string>>(new Set());

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [cgpaFilter, setCgpaFilter] = useState("all");

  // Get unique branches and years for filters
  const branches = Array.from(new Set(availableStudents.map(s => s.branch))).sort();
  const years = Array.from(new Set(availableStudents.map(s => s.year))).sort();

  useEffect(() => {
    fetchStudents();
  }, [collegeId, driveId]);

  useEffect(() => {
    applyFilters();
  }, [availableStudents, searchQuery, branchFilter, yearFilter, cgpaFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/colleges/${collegeId}/interview-drives/${driveId}/tag-students`
      );

      if (response.ok) {
        const data = await response.json();
        setTaggedStudents(data.taggedStudents);
        setAvailableStudents(data.availableStudents);
      } else {
        toast.error('Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Error loading students');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...availableStudents];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.name.toLowerCase().includes(query) ||
          s.rollNumber.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query)
      );
    }

    // Branch filter
    if (branchFilter !== "all") {
      filtered = filtered.filter(s => s.branch === branchFilter);
    }

    // Year filter
    if (yearFilter !== "all") {
      filtered = filtered.filter(s => s.year === parseInt(yearFilter));
    }

    // CGPA filter
    if (cgpaFilter !== "all") {
      const minCgpa = parseFloat(cgpaFilter);
      filtered = filtered.filter(s => s.cgpa >= minCgpa);
    }

    setFilteredAvailable(filtered);
  };

  const handleTagStudents = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student');
      return;
    }

    try {
      setTagging(true);
      const response = await fetch(
        `/api/colleges/${collegeId}/interview-drives/${driveId}/tag-students`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentIds: Array.from(selectedStudents),
            sendNotification: true,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(
          `Tagged ${data.tagged} students successfully! ${data.notificationsSent} notifications sent.`
        );
        setSelectedStudents(new Set());
        fetchStudents();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to tag students');
      }
    } catch (error) {
      console.error('Error tagging students:', error);
      toast.error('Error tagging students');
    } finally {
      setTagging(false);
    }
  };

  const handleUntagStudents = async () => {
    if (selectedTagged.size === 0) {
      toast.error('Please select at least one student to untag');
      return;
    }

    try {
      setTagging(true);
      const studentIds = Array.from(selectedTagged);
      const response = await fetch(
        `/api/colleges/${collegeId}/interview-drives/${driveId}/tag-students`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentIds }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(`Untagged ${data.removed} students successfully!`);
        setSelectedTagged(new Set());
        fetchStudents();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to untag students');
      }
    } catch (error) {
      console.error('Error untagging students:', error);
      toast.error('Error untagging students');
    } finally {
      setTagging(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  const toggleTaggedSelection = (studentId: string) => {
    const newSelection = new Set(selectedTagged);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedTagged(newSelection);
  };

  const selectAllAvailable = () => {
    setSelectedStudents(new Set(filteredAvailable.map(s => s.id)));
  };

  const deselectAllAvailable = () => {
    setSelectedStudents(new Set());
  };

  const selectAllTagged = () => {
    setSelectedTagged(new Set(taggedStudents.map(s => s.studentId)));
  };

  const deselectAllTagged = () => {
    setSelectedTagged(new Set());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tag Students for Interview Drive</h1>
          <p className="text-muted-foreground mt-1">
            Select students to assign to this interview drive
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          ← Back
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tagged Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taggedStudents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Available Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableStudents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedStudents.size}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tagged Students Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tagged Students ({taggedStudents.length})
            </CardTitle>
            <div className="flex gap-2">
              {selectedTagged.size > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAllTagged}
                  >
                    Deselect All
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleUntagStudents}
                    disabled={tagging}
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    Untag Selected ({selectedTagged.size})
                  </Button>
                </>
              )}
              {selectedTagged.size === 0 && taggedStudents.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllTagged}
                >
                  Select All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {taggedStudents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No students tagged yet. Select students below to tag them.
            </p>
          ) : (
            <div className="space-y-2">
              {taggedStudents.map((student) => (
                <div
                  key={student.studentId}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <Checkbox
                    checked={selectedTagged.has(student.studentId)}
                    onCheckedChange={() => toggleTaggedSelection(student.studentId)}
                  />
                  <div className="flex-1 grid grid-cols-5 gap-4">
                    <div>
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-xs text-muted-foreground">{student.rollNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm">{student.branch}</p>
                    </div>
                    <div>
                      <p className="text-sm">Year {student.year}</p>
                    </div>
                    <div>
                      <p className="text-sm">CGPA: {student.cgpa}</p>
                    </div>
                    <div className="text-right">
                      {student.notificationSent && (
                        <Badge variant="outline" className="text-xs">
                          Notified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Students Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Available Students ({filteredAvailable.length})
            </CardTitle>
            <div className="flex gap-2">
              {selectedStudents.size > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAllAvailable}
                  >
                    Deselect All
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleTagStudents}
                    disabled={tagging}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Tag Selected ({selectedStudents.size})
                  </Button>
                </>
              )}
              {selectedStudents.size === 0 && filteredAvailable.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllAvailable}
                >
                  Select All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map(branch => (
                  <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>Year {year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cgpaFilter} onValueChange={setCgpaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All CGPA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All CGPA</SelectItem>
                <SelectItem value="7.0">7.0+</SelectItem>
                <SelectItem value="7.5">7.5+</SelectItem>
                <SelectItem value="8.0">8.0+</SelectItem>
                <SelectItem value="8.5">8.5+</SelectItem>
                <SelectItem value="9.0">9.0+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Students List */}
          {filteredAvailable.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {availableStudents.length === 0
                ? 'All students have been tagged for this drive'
                : 'No students match your filters'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredAvailable.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => toggleStudentSelection(student.id)}
                >
                  <Checkbox
                    checked={selectedStudents.has(student.id)}
                    onCheckedChange={() => toggleStudentSelection(student.id)}
                  />
                  <div className="flex-1 grid grid-cols-5 gap-4">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.rollNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm">{student.branch}</p>
                    </div>
                    <div>
                      <p className="text-sm">Year {student.year}</p>
                    </div>
                    <div>
                      <p className="text-sm">CGPA: {student.cgpa}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
