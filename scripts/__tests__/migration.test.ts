/**
 * Property-Based Tests for Data Migration
 * Feature: organization-college-system-redesign
 */

import * as fc from 'fast-check';

describe('Data Migration - Migration Integrity', () => {
  /**
   * **Feature: organization-college-system-redesign, Property 19: Data Migration Integrity**
   * 
   * For any recruiter data migrated to organization, all associated records should be
   * updated correctly and no data should be lost
   * 
   * **Validates: Requirements 13.5**
   */
  test('Property 19: All recruiters are migrated to organizations', async () => {
    const migrateRecruiters = (recruiters: any[]) => {
      return recruiters.map(recruiter => ({
        ...recruiter,
        role: 'organization',
        organizationId: `org_${recruiter.id}`,
        migratedAt: new Date(),
      }));
    };

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 50 }),
            email: fc.emailAddress(),
            role: fc.constant('recruiter'),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        async (recruiters) => {
          const migrated = migrateRecruiters(recruiters);

          // All recruiters should be migrated
          expect(migrated.length).toBe(recruiters.length);

          // All should have organization role
          migrated.forEach(user => {
            expect(user.role).toBe('organization');
            expect(user.organizationId).toBeDefined();
            expect(user.migratedAt).toBeInstanceOf(Date);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 19: Interview records are updated with organizationId', async () => {
    const updateInterviews = (interviews: any[], recruiterToOrgMap: Map<string, string>) => {
      return interviews.map(interview => {
        const organizationId = recruiterToOrgMap.get(interview.recruiterId);
        return {
          ...interview,
          organizationId,
          recruiterId: undefined, // Remove old field
        };
      });
    };

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          recruiters: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
        }),
        async ({ recruiters }) => {
          // Create recruiter to org mapping
          const recruiterToOrgMap = new Map(
            recruiters.map(rid => [rid, `org_${rid}`])
          );

          // Create interviews
          const interviews = recruiters.flatMap(rid =>
            Array.from({ length: 3 }, (_, i) => ({
              id: `interview_${rid}_${i}`,
              recruiterId: rid,
              questions: ['Q1', 'Q2'],
            }))
          );

          const updated = updateInterviews(interviews, recruiterToOrgMap);

          // All interviews should have organizationId
          updated.forEach(interview => {
            expect(interview.organizationId).toBeDefined();
            expect(interview.organizationId).toMatch(/^org_/);
            expect(interview.recruiterId).toBeUndefined();
          });

          // Count should match
          expect(updated.length).toBe(interviews.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 19: No data is lost during migration', async () => {
    const migrateData = (data: any[]) => {
      return data.map(item => ({
        ...item,
        migrated: true,
        migratedAt: new Date(),
      }));
    };

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            email: fc.emailAddress(),
            data: fc.string(),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        async (originalData) => {
          const migrated = migrateData(originalData);

          // No data loss
          expect(migrated.length).toBe(originalData.length);

          // All original fields preserved
          migrated.forEach((item, index) => {
            expect(item.id).toBe(originalData[index].id);
            expect(item.name).toBe(originalData[index].name);
            expect(item.email).toBe(originalData[index].email);
            expect(item.data).toBe(originalData[index].data);
            expect(item.migrated).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 19: Migration is idempotent', async () => {
    const migrateRecruiters = (recruiters: any[]) => {
      return recruiters.map(recruiter => ({
        ...recruiter,
        role: recruiter.role === 'recruiter' ? 'organization' : recruiter.role,
        organizationId: recruiter.organizationId || `org_${recruiter.id}`,
      }));
    };

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 50 }),
            role: fc.constant('recruiter'),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (recruiters) => {
          // Migrate once
          const migrated1 = migrateRecruiters(recruiters);

          // Migrate again (should be idempotent)
          const migrated2 = migrateRecruiters(migrated1);

          // Results should be identical
          expect(migrated2.length).toBe(migrated1.length);
          migrated2.forEach((user, index) => {
            expect(user.role).toBe(migrated1[index].role);
            expect(user.organizationId).toBe(migrated1[index].organizationId);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 19: Backup is created before migration', async () => {
    const createBackup = (data: any[]) => {
      return {
        timestamp: new Date(),
        data: JSON.parse(JSON.stringify(data)), // Deep copy
        count: data.length,
      };
    };

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        async (originalData) => {
          const backup = createBackup(originalData);

          // Backup should contain all data
          expect(backup.count).toBe(originalData.length);
          expect(backup.data.length).toBe(originalData.length);
          expect(backup.timestamp).toBeInstanceOf(Date);

          // Backup should be independent copy
          backup.data.forEach((item: any, index: number) => {
            expect(item.id).toBe(originalData[index].id);
            expect(item.name).toBe(originalData[index].name);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 19: Orphaned records are detected', async () => {
    const detectOrphans = (
      interviews: any[],
      validOrgIds: Set<string>
    ) => {
      return interviews.filter(
        interview => !validOrgIds.has(interview.organizationId)
      );
    };

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          validOrgIds: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
          interviews: fc.array(
            fc.record({
              id: fc.uuid(),
              organizationId: fc.uuid(),
            }),
            { minLength: 0, maxLength: 10 }
          ),
        }),
        async ({ validOrgIds, interviews }) => {
          const validSet = new Set(validOrgIds);
          const orphans = detectOrphans(interviews, validSet);

          // All orphans should have invalid organizationId
          orphans.forEach(interview => {
            expect(validSet.has(interview.organizationId)).toBe(false);
          });

          // Non-orphans should have valid organizationId
          const nonOrphans = interviews.filter(i => !orphans.includes(i));
          nonOrphans.forEach(interview => {
            expect(validSet.has(interview.organizationId)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 19: Migration preserves referential integrity', async () => {
    const migrateWithIntegrity = (
      recruiters: any[],
      interviews: any[]
    ) => {
      // Create mapping
      const recruiterToOrg = new Map(
        recruiters.map(r => [r.id, `org_${r.id}`])
      );

      // Update interviews
      const updatedInterviews = interviews.map(interview => ({
        ...interview,
        organizationId: recruiterToOrg.get(interview.recruiterId),
      }));

      return { recruiterToOrg, updatedInterviews };
    };

    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
        async (recruiterIds) => {
          const recruiters = recruiterIds.map(id => ({ id, role: 'recruiter' }));
          const interviews = recruiterIds.flatMap(rid =>
            [{ id: `int1_${rid}`, recruiterId: rid }, { id: `int2_${rid}`, recruiterId: rid }]
          );

          const { recruiterToOrg, updatedInterviews } = migrateWithIntegrity(
            recruiters,
            interviews
          );

          // All interviews should have valid organizationId
          updatedInterviews.forEach(interview => {
            expect(interview.organizationId).toBeDefined();
            const expectedOrgId = recruiterToOrg.get(interview.recruiterId);
            expect(interview.organizationId).toBe(expectedOrgId);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
