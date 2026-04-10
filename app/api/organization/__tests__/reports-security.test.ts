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
  requireOrganizationOwnership: jest.fn(),
}));

const { getAuthContext } = require("@/lib/security/auth-context");
const { requireOrganizationOwnership } = require("@/lib/security/guards");
const { GET } = require("@/app/api/organization/[orgId]/reports/route");

function makeRequest() {
  return { nextUrl: { searchParams: new URLSearchParams() } } as any;
}

describe("organization reports security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 401 when unauthenticated", async () => {
    getAuthContext.mockResolvedValue({ ok: false, response: { status: 401 } });
    const response = await GET(makeRequest(), { params: Promise.resolve({ orgId: "org1" }) });
    expect(response.status).toBe(401);
  });

  test("returns 403 when organization ownership check fails", async () => {
    getAuthContext.mockResolvedValue({
      ok: true,
      context: { user: { id: "u1", role: "organization", email: "o@test.com", name: "Org" } },
    });
    requireOrganizationOwnership.mockResolvedValue({ status: 403 });

    const response = await GET(makeRequest(), { params: Promise.resolve({ orgId: "org2" }) });
    expect(response.status).toBe(403);
  });
});
