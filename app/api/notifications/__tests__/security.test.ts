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

jest.mock("@/firebase/admin", () => ({
  db: {
    collection: jest.fn(),
    batch: jest.fn(),
  },
}));

const { getAuthContext } = require("@/lib/security/auth-context");
const { db } = require("@/firebase/admin");
const { GET } = require("@/app/api/notifications/route");
const { POST: markAllRead } = require("@/app/api/notifications/mark-all-read/route");

function makeRequest(query: Record<string, string> = {}, body?: unknown): any {
  return {
    nextUrl: { searchParams: new URLSearchParams(query) },
    json: async () => body,
  };
}

describe("notifications API security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 401 when unauthenticated", async () => {
    getAuthContext.mockResolvedValue({ ok: false, response: { status: 401 } });
    const response = await GET(makeRequest({ userId: "u1" }));
    expect(response.status).toBe(401);
  });

  test("returns 403 for IDOR attempt on userId", async () => {
    getAuthContext.mockResolvedValue({
      ok: true,
      context: { user: { id: "u1", role: "student", email: "a@test.com", name: "A" } },
    });

    const response = await GET(makeRequest({ userId: "u2" }));
    expect(response.status).toBe(403);
  });

  test("returns 200 for valid own notifications query", async () => {
    getAuthContext.mockResolvedValue({
      ok: true,
      context: { user: { id: "u1", role: "student", email: "a@test.com", name: "A" } },
    });

    const getMock = jest.fn().mockResolvedValue({
      docs: [{ id: "n1", data: () => ({ read: false, createdAt: { toDate: () => new Date() } }) }],
    });
    const limitMock = jest.fn().mockReturnValue({ get: getMock });
    const orderByMock = jest.fn().mockReturnValue({ limit: limitMock });
    const where1Mock = jest.fn().mockReturnValue({ orderBy: orderByMock });
    db.collection.mockReturnValue({ where: where1Mock });

    const response = await GET(makeRequest({ userId: "u1" }));
    expect(response.status).toBe(200);
    expect(response.body.unreadCount).toBe(1);
  });

  test("mark-all-read blocks cross-user request with 403", async () => {
    getAuthContext.mockResolvedValue({
      ok: true,
      context: { user: { id: "u1", role: "student", email: "a@test.com", name: "A" } },
    });

    const response = await markAllRead(makeRequest({}, { userId: "u2" }));
    expect(response.status).toBe(403);
  });
});
