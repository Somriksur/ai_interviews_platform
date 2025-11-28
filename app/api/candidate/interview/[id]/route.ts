import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { startInterview } from "@/lib/actions/candidate.action";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "candidate") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const result = await startInterview(id, user.id, user.email);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            interview: result.interview,
        });
    } catch (error) {
        console.error("Error fetching interview:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch interview" },
            { status: 500 }
        );
    }
}
