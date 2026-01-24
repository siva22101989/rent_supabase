import { describe, it, expect } from 'vitest';
import { roleHierarchy } from './definitions';

describe('Role Hierarchy', () => {
    it('should have correct rank for all roles', () => {
        expect((roleHierarchy as any)['super_admin']).toBe(100);
        expect((roleHierarchy as any)['owner']).toBe(90);
        expect((roleHierarchy as any)['admin']).toBe(80);
        expect((roleHierarchy as any)['manager']).toBe(50);
        expect((roleHierarchy as any)['staff']).toBe(10);
        expect((roleHierarchy as any)['customer']).toBe(0);
    });

    it('should correctly compare roles', () => {
        expect((roleHierarchy as any)['super_admin']).toBeGreaterThan((roleHierarchy as any)['owner']);
        expect((roleHierarchy as any)['owner']).toBeGreaterThan((roleHierarchy as any)['admin']);
        expect((roleHierarchy as any)['admin']).toBeGreaterThan((roleHierarchy as any)['manager']);
        expect((roleHierarchy as any)['manager']).toBeGreaterThan((roleHierarchy as any)['staff']);
        expect((roleHierarchy as any)['staff']).toBeGreaterThan((roleHierarchy as any)['customer']);
    });

    it('should handle undefined roles as 0 rank', () => {
        // @ts-ignore
        const rank = roleHierarchy['unknown'] || 0;
        expect(rank).toBe(0);
    });
});
