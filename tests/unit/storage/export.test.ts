import { describe, it, expect } from 'vitest';
import {
  exportToJson,
  importFromJson,
  exportMultipleProfiles,
  importProfilesFromJson,
} from '@storage/export';
import { createProfile } from '@models/profile';
import { createIncome } from '@models/income';
import { createDebt } from '@models/debt';
import { dollarsToCents } from '@models/common';

describe('export', () => {
  describe('exportToJson', () => {
    it('should export profile to valid JSON', () => {
      const profile = createProfile({
        name: 'Test Profile',
        income: [createIncome({ name: 'Salary', amount: dollarsToCents(100000) })],
      });

      const result = exportToJson(profile);

      expect(result.filename).toMatch(/^test-profile-\d{4}-\d{2}-\d{2}\.json$/);
      expect(result.data.version).toBe('1.0');
      expect(result.data.app).toBe('financial-path-visualizer');
      expect(result.data.profile.name).toBe('Test Profile');
      expect(result.json).toBeTruthy();
      expect(result.size).toBeGreaterThan(0);
    });

    it('should sanitize filename for special characters', () => {
      const profile = createProfile({
        name: 'Test / Profile: With * Special? Characters!',
      });

      const result = exportToJson(profile);

      // Should only contain alphanumeric and hyphens
      expect(result.filename).toMatch(/^[a-z0-9-]+-\d{4}-\d{2}-\d{2}\.json$/);
      expect(result.filename).not.toMatch(/[/*?:!]/);
    });

    it('should include all profile data', () => {
      const profile = createProfile({
        name: 'Full Profile',
        income: [createIncome({ name: 'Job', amount: dollarsToCents(80000) })],
        debts: [createDebt({ name: 'Mortgage', principal: dollarsToCents(300000) })],
      });

      const result = exportToJson(profile);
      const parsed = JSON.parse(result.json);

      expect(parsed.profile.income).toHaveLength(1);
      expect(parsed.profile.debts).toHaveLength(1);
      expect(parsed.profile.income[0].name).toBe('Job');
      expect(parsed.profile.debts[0].name).toBe('Mortgage');
    });
  });

  describe('importFromJson', () => {
    it('should import valid export JSON', () => {
      const profile = createProfile({ name: 'Original Profile' });
      const exported = exportToJson(profile);

      const result = importFromJson(exported.json);

      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
      expect(result.profile?.name).toBe('Original Profile');
      expect(result.warnings).toHaveLength(0);
    });

    it('should generate new ID on import', () => {
      const profile = createProfile({ name: 'Test' });
      const originalId = profile.id;
      const exported = exportToJson(profile);

      const result = importFromJson(exported.json);

      expect(result.profile?.id).not.toBe(originalId);
    });

    it('should reject invalid JSON', () => {
      const result = importFromJson('not valid json');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid JSON format');
    });

    it('should reject missing required fields', () => {
      const result = importFromJson(JSON.stringify({ foo: 'bar' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid export file format');
    });

    it('should reject wrong app identifier', () => {
      const invalidExport = {
        version: '1.0',
        app: 'wrong-app',
        exportedAt: new Date().toISOString(),
        profile: createProfile(),
      };

      const result = importFromJson(JSON.stringify(invalidExport));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid export file format');
    });

    it('should handle version migration', () => {
      const oldVersionExport = {
        version: '0.9',
        app: 'financial-path-visualizer',
        exportedAt: new Date().toISOString(),
        profile: createProfile({ name: 'Old Profile' }),
      };

      const result = importFromJson(JSON.stringify(oldVersionExport));

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('version 0.9');
    });

    it('should fill missing fields with defaults', () => {
      const minimalProfile = {
        id: 'test-id',
        name: 'Minimal',
        income: [],
        debts: [],
        // Missing: obligations, assets, goals, assumptions
      };

      const exported = {
        version: '1.0',
        app: 'financial-path-visualizer',
        exportedAt: new Date().toISOString(),
        profile: minimalProfile,
      };

      const result = importFromJson(JSON.stringify(exported));

      expect(result.success).toBe(true);
      expect(result.profile?.obligations).toEqual([]);
      expect(result.profile?.assets).toEqual([]);
      expect(result.profile?.goals).toEqual([]);
      expect(result.profile?.assumptions).toBeDefined();
      expect(result.profile?.assumptions.inflationRate).toBe(0.03);
    });
  });

  describe('exportMultipleProfiles', () => {
    it('should export multiple profiles', () => {
      const profiles = [
        createProfile({ name: 'Profile 1' }),
        createProfile({ name: 'Profile 2' }),
      ];

      const json = exportMultipleProfiles(profiles);
      const parsed = JSON.parse(json);

      expect(parsed.version).toBe('1.0');
      expect(parsed.app).toBe('financial-path-visualizer');
      expect(parsed.profiles).toHaveLength(2);
      expect(parsed.profiles[0].name).toBe('Profile 1');
      expect(parsed.profiles[1].name).toBe('Profile 2');
    });

    it('should handle empty array', () => {
      const json = exportMultipleProfiles([]);
      const parsed = JSON.parse(json);

      expect(parsed.profiles).toHaveLength(0);
    });
  });

  describe('importProfilesFromJson', () => {
    it('should import every profile from an "Export All Data" backup', () => {
      const originals = [
        createProfile({ name: 'Profile 1' }),
        createProfile({ name: 'Profile 2' }),
      ];

      const result = importProfilesFromJson(exportMultipleProfiles(originals));

      expect(result.success).toBe(true);
      expect(result.profiles.map((p) => p.name)).toEqual(['Profile 1', 'Profile 2']);
      // Imported copies get fresh IDs, like single-profile imports
      expect(result.profiles[0]?.id).not.toBe(originals[0]?.id);
      expect(result.profiles[1]?.id).not.toBe(originals[1]?.id);
    });

    it('should import a single-profile export', () => {
      const exported = exportToJson(createProfile({ name: 'Solo' }));

      const result = importProfilesFromJson(exported.json);

      expect(result.success).toBe(true);
      expect(result.profiles.map((p) => p.name)).toEqual(['Solo']);
    });

    it('should import nothing if any profile in a backup is invalid', () => {
      const backup = JSON.parse(exportMultipleProfiles([createProfile({ name: 'Good' })])) as {
        profiles: unknown[];
      };
      backup.profiles.push({ not: 'a profile' });

      const result = importProfilesFromJson(JSON.stringify(backup));

      expect(result.success).toBe(false);
      expect(result.profiles).toHaveLength(0);
      expect(result.error).toContain('Profile 2');
    });

    it('should reject a backup with no profiles', () => {
      const result = importProfilesFromJson(exportMultipleProfiles([]));

      expect(result.success).toBe(false);
      expect(result.profiles).toHaveLength(0);
    });

    it('should reject invalid JSON and unknown formats', () => {
      expect(importProfilesFromJson('not valid json')).toMatchObject({
        success: false,
        error: 'Invalid JSON format',
      });
      expect(importProfilesFromJson(JSON.stringify({ foo: 'bar' }))).toMatchObject({
        success: false,
        error: 'Invalid export file format',
      });
    });
  });

  describe('round-trip', () => {
    it('should preserve profile data through export/import cycle', () => {
      const original = createProfile({
        name: 'Round Trip Test',
        income: [
          createIncome({
            name: 'Primary',
            type: 'salary',
            amount: dollarsToCents(120000),
            hoursPerWeek: 40,
            expectedGrowth: 0.03,
          }),
        ],
        debts: [
          createDebt({
            name: 'Car Loan',
            type: 'auto',
            principal: dollarsToCents(25000),
            interestRate: 0.055,
            actualPayment: dollarsToCents(450),
          }),
        ],
      });

      const exported = exportToJson(original);
      const imported = importFromJson(exported.json);

      expect(imported.success).toBe(true);
      expect(imported.profile?.name).toBe(original.name);
      expect(imported.profile?.income[0]?.name).toBe('Primary');
      expect(imported.profile?.income[0]?.amount).toBe(dollarsToCents(120000));
      expect(imported.profile?.debts[0]?.name).toBe('Car Loan');
      expect(imported.profile?.debts[0]?.principal).toBe(dollarsToCents(25000));
    });
  });
});
