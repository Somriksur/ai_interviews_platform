/**
 * @jest-environment node
 */

(global as any).Request = class {};
(global as any).Response = class {
  static json(body: unknown, init?: { status?: number }) {
    return { status: init?.status ?? 200, body };
  }
};
(global as any).Headers = class {};

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ status: init?.status ?? 200, body }),
  },
}));

jest.mock("@/lib/security/auth-context", () => ({
  getAuthContext: jest.fn(),
}));

jest.mock("@/lib/security/guards", () => ({
  requireStudentAccess: jest.fn(),
}));

jest.mock("@/firebase/admin", () => ({
  db: {
    collection: jest.fn(),
  },
}));

const { getAuthContext } = require("@/lib/security/auth-context");
const { requireStudentAccess } = require("@/lib/security/guards");
const { db } = require("@/firebase/admin");
const { GET } = require("@/app/api/students/[studentId]/assigned-interviews/route");

describe("assigned interviews security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 401 for unauthenticated requests", async () => {
    getAuthContext.mockResolvedValue({ ok: false, response: { status: 401 } });
    const response = await GET({} as any, { params: Promise.resolve({ studentId: "s1" }) });
    expect(response.status).toBe(401);
  });

  test("returns 403 when guard blocks IDOR access", async () => {
    getAuthContext.mockResolvedValue({
      ok: true,
      context: { user: { id: "u1", role: "student", email: "a@test.com", name: "A" } },
    });
    requireStudentAccess.mockResolvedValue({ status: 403 });

    const response = await GET({} as any, { params: Promise.resolve({ studentId: "s2" }) });
    expect(response.status).toBe(403);
  });

  test("returns 200 for authorized access", async () => {
    getAuthContext.mockResolvedValue({
      ok: true,
      context: { user: { id: "u1", role: "student", email: "a@test.com", name: "A" } },
    });
    requireStudentAccess.mockResolvedValue(null);

    db.collection.mockImplementation((name: string) => {
      if (name === "students") {
        return {
          doc: () => ({
            get: async () => ({
              exists: true,
              data: () => ({ normalizedCollegeName: "x-college", collegeName: "X College" }),
            }),
          }),
        };
      }

      if (name === "interview_drives") {
        return {
          where: () => ({
            get: async () => ({
              docs: [
                {
                  id: "d1",
                  data: () => ({
                    name: "Drive 1",
                    taggedStudents: [{ studentId: "s1", taggedAt: { toDate: () => new Date() } }],
                    taggedColleges: ["x-college"],
                  }),
                },
              ],
            }),
          }),
        };
      }

      return {};
    });

    const response = await GET({} as any, { params: Promise.resolve({ studentId: "s1" }) });
    expect(response.status).toBe(200);
    expect(response.body.totalCount).toBe(1);
  });
});
