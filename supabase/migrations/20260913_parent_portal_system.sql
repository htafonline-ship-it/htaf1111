-- =========================================================================
-- منصة هتاف التعليمية الذكية - نظام ولي الأمر الشامل (Parent Portal System)
-- يغطي: طلبات ربط الأبناء، ارتباطات أولياء الأمور، مواعيد ولقاءات أولياء الأمور، والبحث المقيد الآمن
-- تاريخ الإنشاء: 2026-09-13
-- =========================================================================

-- 1. جدول طلبات ربط أولياء الأمور بالأبناء
CREATE TABLE IF NOT EXISTS public.parent_link_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_user_id TEXT NOT NULL,
    parent_email TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    student_id UUID NOT NULL,
    school_id TEXT NOT NULL,
    relationship TEXT NOT NULL DEFAULT 'father', -- father, mother, guardian
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    rejection_reason TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. جدول ارتباط أولياء الأمور بالطلاب (student_parents)
CREATE TABLE IF NOT EXISTS public.student_parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_user_id TEXT NOT NULL,
    student_id UUID NOT NULL,
    school_id TEXT NOT NULL,
    relationship TEXT NOT NULL DEFAULT 'father', -- father, mother, guardian
    parent_name TEXT,
    parent_phone TEXT,
    parent_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_parent_student_link UNIQUE (parent_user_id, student_id)
);

-- 3. جدول طلبات اللقاء والتواصل لولي الأمر (parent_meeting_requests)
CREATE TABLE IF NOT EXISTS public.parent_meeting_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL,
    parent_user_id TEXT NOT NULL,
    parent_name TEXT,
    parent_phone TEXT,
    student_id UUID NOT NULL,
    student_name TEXT,
    teacher_id TEXT,
    teacher_name TEXT,
    target_role TEXT DEFAULT 'teacher', -- teacher, counselor, principal, vice_principal
    subject TEXT NOT NULL,
    meeting_type TEXT DEFAULT 'in_person', -- in_person, phone, online
    preferred_date DATE,
    preferred_time TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, completed
    school_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. مؤشرات البحث والفهرسة لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_parent_link_requests_parent ON public.parent_link_requests (parent_user_id, status);
CREATE INDEX IF NOT EXISTS idx_parent_link_requests_school ON public.parent_link_requests (school_id, status);
CREATE INDEX IF NOT EXISTS idx_student_parents_parent ON public.student_parents (parent_user_id);
CREATE INDEX IF NOT EXISTS idx_student_parents_student ON public.student_parents (student_id);
CREATE INDEX IF NOT EXISTS idx_student_parents_school ON public.student_parents (school_id);
CREATE INDEX IF NOT EXISTS idx_parent_meeting_requests_parent ON public.parent_meeting_requests (parent_user_id);
CREATE INDEX IF NOT EXISTS idx_parent_meeting_requests_school ON public.parent_meeting_requests (school_id, status);

-- 5. تفعيل أمان مستوى الصفوف (Row Level Security)
ALTER TABLE public.parent_link_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_meeting_requests ENABLE ROW LEVEL SECURITY;

-- 6. سياسات RLS لجدول parent_link_requests
DO $$
BEGIN
    DROP POLICY IF EXISTS "parent_link_requests_select" ON public.parent_link_requests;
    DROP POLICY IF EXISTS "parent_link_requests_insert" ON public.parent_link_requests;
    DROP POLICY IF EXISTS "parent_link_requests_update" ON public.parent_link_requests;
    DROP POLICY IF EXISTS "parent_link_requests_all" ON public.parent_link_requests;
END $$;

CREATE POLICY "parent_link_requests_select" ON public.parent_link_requests
    FOR SELECT
    USING (
        parent_user_id = auth.uid()::text
        OR (auth.jwt() ->> 'email' IS NOT NULL AND parent_email = auth.jwt() ->> 'email')
        OR public.is_school_admin_or_principal(school_id)
        OR public.is_super_admin()
    );

CREATE POLICY "parent_link_requests_insert" ON public.parent_link_requests
    FOR INSERT
    WITH CHECK (
        parent_user_id = auth.uid()::text
        OR auth.uid() IS NOT NULL
    );

CREATE POLICY "parent_link_requests_update" ON public.parent_link_requests
    FOR UPDATE
    USING (
        public.is_school_admin_or_principal(school_id)
        OR public.is_super_admin()
        OR parent_user_id = auth.uid()::text
    );

-- 7. سياسات RLS لجدول student_parents
DO $$
BEGIN
    DROP POLICY IF EXISTS "student_parents_select" ON public.student_parents;
    DROP POLICY IF EXISTS "student_parents_all" ON public.student_parents;
END $$;

CREATE POLICY "student_parents_select" ON public.student_parents
    FOR SELECT
    USING (
        parent_user_id = auth.uid()::text
        OR public.is_school_admin_or_principal(school_id)
        OR public.is_super_admin()
    );

CREATE POLICY "student_parents_all" ON public.student_parents
    FOR ALL
    USING (
        public.is_school_admin_or_principal(school_id)
        OR public.is_super_admin()
        OR parent_user_id = auth.uid()::text
    )
    WITH CHECK (
        public.is_school_admin_or_principal(school_id)
        OR public.is_super_admin()
        OR parent_user_id = auth.uid()::text
    );

-- 8. سياسات RLS لجدول parent_meeting_requests
DO $$
BEGIN
    DROP POLICY IF EXISTS "parent_meeting_requests_select" ON public.parent_meeting_requests;
    DROP POLICY IF EXISTS "parent_meeting_requests_insert" ON public.parent_meeting_requests;
    DROP POLICY IF EXISTS "parent_meeting_requests_update" ON public.parent_meeting_requests;
END $$;

CREATE POLICY "parent_meeting_requests_select" ON public.parent_meeting_requests
    FOR SELECT
    USING (
        parent_user_id = auth.uid()::text
        OR public.is_school_admin_or_principal(school_id)
        OR public.is_super_admin()
    );

CREATE POLICY "parent_meeting_requests_insert" ON public.parent_meeting_requests
    FOR INSERT
    WITH CHECK (
        parent_user_id = auth.uid()::text
        OR auth.uid() IS NOT NULL
    );

CREATE POLICY "parent_meeting_requests_update" ON public.parent_meeting_requests
    FOR UPDATE
    USING (
        public.is_school_admin_or_principal(school_id)
        OR public.is_super_admin()
    );

-- 9. دالة RPC الآمنة: find_student_for_parent
-- تمنع تصفح أو تسريب بيانات بقية الطلاب وتتحقق بدقة من المدرسة ورقم هوية/كود الطالب
CREATE OR REPLACE FUNCTION public.find_student_for_parent(
    p_school_id TEXT,
    p_student_number TEXT,
    p_verification_value TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    school_id TEXT,
    full_name TEXT,
    grade_name TEXT,
    classroom_name TEXT,
    student_number TEXT,
    has_matching_contact BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.school_id,
        s.full_name,
        s.grade_name,
        s.classroom_name,
        s.student_number,
        CASE 
            WHEN p_verification_value IS NOT NULL AND (
                (s.parent_phone IS NOT NULL AND s.parent_phone <> '' AND s.parent_phone ILIKE '%' || p_verification_value || '%') OR 
                (s.parent_email IS NOT NULL AND s.parent_email <> '' AND s.parent_email ILIKE p_verification_value) OR
                (s.student_number IS NOT NULL AND s.student_number <> '' AND s.student_number ILIKE p_verification_value)
            ) THEN true
            ELSE false
        END AS has_matching_contact
    FROM public.students s
    WHERE s.school_id = p_school_id
      AND (
          s.student_number = p_student_number OR
          s.id::text = p_student_number
      )
      AND s.status = 'active'
    LIMIT 1;
END;
$$;

-- 10. إشعار PostgREST بتحديث كاش المخطط
NOTIFY pgrst, 'reload schema';
