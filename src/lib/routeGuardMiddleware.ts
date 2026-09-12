import { UserRole } from '../types';
import { SupabaseSchoolUserLink } from './supabase';

export interface RouteCheckResult {
  allowed: boolean;
  reason?: string;
  suggestedTab?: string;
}

export function isPlatformAdminRole(role: UserRole): boolean {
  return role === 'super_admin' || role === 'platform_admin';
}

export function isSchoolAdminRole(role: UserRole): boolean {
  return role === 'principal' || role === 'vice_principal' || role === 'school_admin' || role === 'school_manager';
}

export function isCounselorRole(role: UserRole): boolean {
  return role === 'counselor';
}

/**
 * Route Guard Middleware - Check Tab Authorization
 */
export function checkTabPermission(
  tab: string,
  role: UserRole,
  userSchoolLink: SupabaseSchoolUserLink | null,
  user?: { nationalId?: string; username?: string; email?: string; id?: string }
): RouteCheckResult {
  const isPlatformAdmin = isPlatformAdminRole(role);
  const isSchoolAdmin = isSchoolAdminRole(role);
  const isCounselor = isCounselorRole(role);

  if (tab === 'platform-admin' || tab === 'super_admin') {
    if (!isPlatformAdmin) {
      return {
        allowed: false,
        reason: 'لوحة الأدمن العام محصورة لمدير المنصة المعتمد فقط.',
        suggestedTab: 'dashboard'
      };
    }

    // Strict exclusive admin check: الادمن فقط 1007363904
    if (user) {
      const cleanId = (user.nationalId || user.username || '').trim();
      const cleanEmail = (user.email || '').trim().toLowerCase();
      const isDesignatedAdmin =
        cleanId === '1007363904' ||
        cleanEmail === 'admin.1007363904@htaf.online' ||
        cleanEmail === 'htaf.online@gmail.com' ||
        user.id === 'admin_1007363904';

      if (!isDesignatedAdmin) {
        return {
          allowed: false,
          reason: 'صلاحيات الأدمن العام مخصصة حصرياً لمدير المنصة الرئيسي.',
          suggestedTab: 'dashboard'
        };
      }
    }
  }

  if (tab === 'school-mgmt') {
    if (!isSchoolAdmin && !isPlatformAdmin) {
      return {
        allowed: false,
        reason: 'صفحة إدارة المدرسة مخصصة لمدراء المدارس ووكلائها فقط.',
        suggestedTab: 'dashboard'
      };
    }
  }

  if (tab === 'counseling') {
    if (!isCounselor && !isSchoolAdmin && !isPlatformAdmin) {
      return {
        allowed: false,
        reason: 'صفحة الإرشاد الطلابي وسجلات السرية مخصصة للوجهين والمرشدين فقط.',
        suggestedTab: 'dashboard'
      };
    }
  }

  if (tab === 'parent-portal') {
    if (role !== 'parent' && !isPlatformAdmin) {
      return {
        allowed: false,
        reason: 'بوابة ولي الأمر مخصصة لأولياء الأمور فقط.',
        suggestedTab: 'dashboard'
      };
    }
  }

  return { allowed: true };
}

/**
 * Route Guard Middleware - Check School Isolation & Multi-Tenant Access
 */
export function checkSchoolTenantAccess(
  targetSchoolId: string | null | undefined,
  userSchoolLink: SupabaseSchoolUserLink | null,
  role: UserRole
): RouteCheckResult {
  // Platform admins and parents can access based on their specific scopes
  if (isPlatformAdminRole(role) || role === 'parent') {
    return { allowed: true };
  }

  // Regular users MUST be bound to their linked school_id
  if (!userSchoolLink || userSchoolLink.status !== 'active') {
    return {
      allowed: false,
      reason: 'حسابك غير مرتبط ببيانات مدرسة مفعلة في النظام.',
      suggestedTab: 'dashboard'
    };
  }

  if (targetSchoolId && targetSchoolId !== userSchoolLink.school_id) {
    return {
      allowed: false,
      reason: 'غير مسموح بتبديل المدرسة أو عرض بيانات مدرسة أخرى خارج نطاق حسلبك.',
      suggestedTab: 'dashboard'
    };
  }

  return { allowed: true };
}
