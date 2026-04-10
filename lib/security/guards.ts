import { NextResponse } from "next/server";
import { db } from "@/firebase/admin";
import { AuthContext } from "@/lib/security/auth-context";

export function requireRole(
  context: AuthContext,
  roles: Array<User["role"]>
): NextResponse | null {
  if (!roles.includes(context.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export function requireUserMatch(
  context: AuthContext,
  userId: string
): NextResponse | null {
  if (context.user.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export function requireEmailMatch(
  context: AuthContext,
  email: string
): NextResponse | null {
  const normalizedRequested = email.trim().toLowerCase();
  const normalizedUserEmail = (context.user.email || "").trim().toLowerCase();

  if (!normalizedRequested || normalizedRequested !== normalizedUserEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export async function requireOrganizationOwnership(
  context: AuthContext,
  organizationId: string
): Promise<NextResponse | null> {
  const roleError = requireRole(context, ["organization"]);
  if (roleError) return roleError;

  const orgDoc = await db.collection("organizations").doc(organizationId).get();
  if (!orgDoc.exists) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  if (orgDoc.data()?.adminId !== context.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export async function requireCollegeOwnership(
  context: AuthContext,
  collegeId: string
): Promise<NextResponse | null> {
  const roleError = requireRole(context, ["college"]);
  if (roleError) return roleError;

  const collegeDoc = await db.collection("colleges").doc(collegeId).get();
  if (!collegeDoc.exists) {
    return NextResponse.json({ error: "College not found" }, { status: 404 });
  }

  if (collegeDoc.data()?.adminId !== context.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export async function requireStudentOwnership(
  context: AuthContext,
  studentId: string
): Promise<NextResponse | null> {
  const roleError = requireRole(context, ["student"]);
  if (roleError) return roleError;

  const studentDoc = await db.collection("students").doc(studentId).get();
  if (!studentDoc.exists) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const studentData = studentDoc.data();
  const ownsStudent =
    studentData?.userId === context.user.id ||
    (!!studentData?.email && studentData.email === context.user.email);

  if (!ownsStudent) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export async function requireStudentAccess(
  context: AuthContext,
  studentId: string
): Promise<NextResponse | null> {
  const studentDoc = await db.collection("students").doc(studentId).get();
  if (!studentDoc.exists) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const studentData = studentDoc.data();

  if (context.user.role === "student") {
    const ownsStudent =
      studentData?.userId === context.user.id ||
      (!!studentData?.email && studentData.email === context.user.email);

    if (!ownsStudent) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return null;
  }

  if (context.user.role === "college") {
    const collegeDoc = await db.collection("colleges").doc(studentData?.collegeId || "").get();
    if (!collegeDoc.exists || collegeDoc.data()?.adminId !== context.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return null;
  }

  if (context.user.role === "organization") {
    const orgSnapshot = await db
      .collection("organizations")
      .where("adminId", "==", context.user.id)
      .limit(1)
      .get();

    if (orgSnapshot.empty) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orgId = orgSnapshot.docs[0].id;
    if (studentData?.organizationId !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return null;
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
