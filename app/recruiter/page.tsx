import { redirect } from "next/navigation";

export default function RecruiterPage() {
    // Redirect to dashboard when accessing /recruiter directly
    redirect("/recruiter/dashboard");
}
