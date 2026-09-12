-- =========================================================================
-- منصة حقائق العلوم - تحديث وترقية مخطط جدول المدارس (Supabase Schema Migration)
-- يحل مشكلة: Could not find the 'academic_year' column of 'schools' in the schema cache
-- تاريخ التحديث: 2026-09-12
-- =========================================================================

-- 1. إضافة عمود academic_year وكافة الأعمدة التوسعية لجدول public.schools
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '1447 - 1448 هـ (2026/2027م)';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'حكومية';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS education_type TEXT DEFAULT 'حكومية';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS gender_type TEXT DEFAULT 'مشتركة';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS school_gender TEXT DEFAULT 'mixed';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'مجمع تعليمي (ابتدائي - متوسط - ثانوي)';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'المملكة العربية السعودية';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS region_id TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS governorate TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS governorate_id TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS city_id TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS short_national_address TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS education_directorate TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS moe_code TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS principal_name TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS invitation_code TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. إنشاء جدول ارتباط مستخدمي المدارس public.school_users إن لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.school_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'school_admin',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. تفعيل وتأمين سياسات الأمان Row Level Security (RLS)
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_users ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- سياسات جدول schools
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schools' AND policyname = 'Allow public read on schools') THEN
        CREATE POLICY "Allow public read on schools" ON public.schools FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schools' AND policyname = 'Allow insert on schools') THEN
        CREATE POLICY "Allow insert on schools" ON public.schools FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schools' AND policyname = 'Allow update on schools') THEN
        CREATE POLICY "Allow update on schools" ON public.schools FOR UPDATE USING (true);
    END IF;

    -- سياسات جدول school_users
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'school_users' AND policyname = 'Allow all on school_users') THEN
        CREATE POLICY "Allow all on school_users" ON public.school_users FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 4. إشعار محرك PostgREST بتحديث كاش المخطط فوراً (Schema Cache Reload)
NOTIFY pgrst, 'reload schema';
