/**
 * @jest-environment node
 */

(global as any).Request = class {};
(global as any).Response = class {
  static json(_body: unknown, init?: { status?: number }) {
    return { status: init?.status ?? 200 };
  }
};
(global as any).Headers = class {};

jest.mock("@/firebase/admin", () => ({
  db: {
    collection: jest.fn(),
  },
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (_body: unknown, init?: { status?: number }) => ({ status: init?.status ?? 200 }),
  },
}));

const { db } = require("@/firebase/admin");
const { requireRole, requireOrganizationOwnership } = require("@/lib/security/guards");

describe("security guards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("requireRole allows expected role", () => {
    const result = requireRole(
      { user: { id: "u1", email: "a@test.com", name: "A", role: "organization" } },
      ["organization"]
    );

    expect(result).toBeNull();
  });

  test("requireRole blocks unexpected role", () => {
    const result = requireRole(
      { user: { id: "u1", email: "a@test.com", name: "A", role: "student" } },
      ["organization"]
    );

    expect(result?.status).toBe(403);
  });

  test("requireOrganizationOwnership returns 404 for missing org", async () => {
    db.collection.mockReturnValue({
      doc: () => ({
        get: async () => ({ exists: false }),
      }),
    });

    const response = await requireOrganizationOwnership(
      { user: { id: "owner-1", email: "owner@test.com", name: "Owner", role: "organization" } },
      "org-1"
    );

    expect(response?.status).toBe(404);
  });

  test("requireOrganizationOwnership returns 403 for non-owner", async () => {
    db.collection.mockReturnValue({
      doc: () => ({
        get: async () => ({ exists: true, data: () => ({ adminId: "other" }) }),
      }),
    });

    const response = await requireOrganizationOwnership(
      { user: { id: "owner-1", email: "owner@test.com", name: "Owner", role: "organization" } },
      "org-1"
    );

    expect(response?.status).toBe(403);
  });

  test("requireOrganizationOwnership allows owner", async () => {
    db.collection.mockReturnValue({
      doc: () => ({
        get: async () => ({ exists: true, data: () => ({ adminId: "owner-1" }) }),
      }),
    });

    const response = await requireOrganizationOwnership(
      { user: { id: "owner-1", email: "owner@test.com", name: "Owner", role: "organization" } },
      "org-1"
    );

    expect(response).toBeNull();
  });
});
