import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireStudentAccess } from "@/lib/security/guards";
import { parseAndScoreResume } from "@/lib/services/resume-nlp.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { studentId } = await params;
    const accessError = await requireStudentAccess(authResult.context, studentId);
    if (accessError) return accessError;

    const body = await request.json();
    const { resumeText, fileName, fileSize, fileType } = body;

    if (!resumeText) {
      return NextResponse.json(
        { error: "Resume text is required" },
        { status: 400 }
      );
    }

    console.log(`📄 Processing resume for student ${studentId}...`);
    console.log(`📎 File: ${fileName || 'unknown'} (${fileSize ? Math.round(fileSize / 1024) + 'KB' : 'unknown size'})`);

    // Use enhanced NLP service to parse and score resume
    const parseResult = parseAndScoreResume(resumeText);
    
    console.log(`✅ Resume parsed successfully:`, {
      skills: parseResult.skills.length,
      projects: parseResult.projects.length,
      domain: parseResult.domain,
      score: parseResult.resumeScore,
      confidence: parseResult.confidence
    });

    // Extract skill names for storage
    const extractedSkills = parseResult.skills.map(s => s.name);

    // Get current student data
    const studentDoc = await db.collection("students").doc(studentId).get();
    if (!studentDoc.exists) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const currentData = studentDoc.data() || {};
    const existingSkills = currentData.skills || [];

    // Merge existing skills with extracted skills (remove duplicates)
    const mergedSkills = Array.from(
      new Set([...existingSkills, ...extractedSkills])
    );

    // Store resume text in Firestore (truncate if too long)
    const resumeTextToStore = resumeText.length > 50000 
      ? resumeText.substring(0, 50000) + '...[truncated]'
      : resumeText;

    // Clean education data - remove undefined values
    const cleanEducation = parseResult.education.map(edu => ({
      degree: edu.degree || 'Not specified',
      institution: edu.institution || 'Not specified',
      ...(edu.year && { year: edu.year }) // Only include year if it exists
    }));

    // Clean projects data - remove undefined values
    const cleanProjects = parseResult.projects.map(p => ({
      name: p.name,
      description: p.description,
      complexityScore: p.complexityScore,
      technologies: p.technologies || [],
      ...(p.domain && { domain: p.domain }) // Only include domain if it exists
    }));

    // Update student document with enhanced data
    await db.collection("students").doc(studentId).update({
      resumeText: resumeTextToStore,
      resumeFileName: fileName || 'resume.txt',
      resumeFileSize: fileSize || 0,
      resumeFileType: fileType || 'text/plain',
      extractedSkills,
      skills: mergedSkills,
      resumeScore: parseResult.resumeScore,
      resumeParsedAt: new Date(),
      updatedAt: new Date(),
      // Store additional parsed data
      education: cleanEducation,
      experienceLevel: parseResult.experienceLevel,
      domain: parseResult.domain,
      projectComplexityScore: parseResult.projectComplexityScore,
      // Store skills with proficiency
      skillsWithProficiency: parseResult.skills.map(s => ({
        name: s.name,
        level: s.level,
        confidence: s.confidence
      })),
      // Store projects
      projects: cleanProjects
    });

    console.log(`✅ Student profile updated with resume data`);

    return NextResponse.json({
      success: true,
      extractedSkills,
      totalSkills: mergedSkills.length,
      resumeScore: parseResult.resumeScore,
      domain: parseResult.domain,
      experienceLevel: parseResult.experienceLevel,
      projectsCount: parseResult.projects.length,
      confidence: parseResult.confidence,
      explanation: parseResult.explanation
    });
  } catch (error) {
    console.error("❌ Error processing resume:", error);
    return NextResponse.json(
      { 
        error: "Failed to process resume",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
