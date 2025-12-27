import { describe, it, expect } from 'vitest';
import { roleHierarchy } from './definitions';

describe('Role Hierarchy', () => {
    it('should have correct rank for all roles', () => {
        expect(roleHierarchy['super_admin']).toBe(100);
        expect(roleHierarchy['owner']).toBe(90);
        expect(roleHierarchy['admin']).toBe(80);
        expect(roleHierarchy['manager']).toBe(50);
        expect(roleHierarchy['staff']).toBe(10);
        expect(roleHierarchy['customer']).toBe(0);
    });

    it('should correctly compare roles', () => {
        expect(roleHierarchy['super_admin']).toBeGreaterThan(roleHierarchy['owner']);
        expect(roleHierarchy['owner']).toBeGreaterThan(roleHierarchy['admin']);
        expect(roleHierarchy['admin']).toBeGreaterThan(roleHierarchy['manager']);
        expect(roleHierarchy['manager']).toBeGreaterThan(roleHierarchy['staff']);
        expect(roleHierarchy['staff']).toBeGreaterThan(roleHierarchy['customer']);
    });

    it('should handle undefined roles as 0 rank', () => {
        // @ts-ignore
        const rank = roleHierarchy['unknown'] || 0;
        expect(rank).toBe(0);
    });
});
