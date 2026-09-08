-- =========================================================================
-- منصة حقائق العلوم - الهجرة الأمنية الشاملة لسياسات عزل المدارس (Multi-School Isolation RLS)
-- تاريخ الإنشاء: 2026-09-07
-- الهدف: استبدال كافة سياسات auth.role() = 'authenticated' و USING (true)
-- بعزل حقيقي قائم على معرف المدرسة school_id، العضوية الفعلية في المحادثات،
-- الصلاحيات الدقيقة للأدوار (Super Admin, Principal, Teacher, Student, Parent).
-- =========================================================================

-- -------------------------------------------------------------------------
-- الخطوة 1: دوال الأمان المساعدة (Security Definer Helper Functions)
-- -------------------------------------------------------------------------

-- 1. معرف مدرسة المستخدم الحالي من جدول profiles
CREATE OR REPLACE FUNCTION public.current_user_school_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id::text FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. دور المستخدم الحالي من جدول profiles
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 3. التحقق من صلاحية مسؤول المنصة (Super Admin)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'platform_admin')
      AND (account_status = 'active' OR account_status IS NULL)
  );
$$;

-- 4. التحقق من إدارة المدرسة أو مديرها (School Admin / Principal)
CREATE OR REPLACE FUNCTION public.is_school_admin_or_principal(check_school_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND school_id = check_school_id
        AND role IN ('principal', 'vice_principal', 'admin', 'school_admin')
        AND (account_status = 'active' OR account_status IS NULL)
    )
  );
$$;

-- -------------------------------------------------------------------------
-- الخطوة 2: تحديث جدول profiles بدون DROP وبدون إعادة إنشاء
-- -------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grade_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_demo_account BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- إلغاء السياسات السابقة غير الآمنة على profiles
DROP POLICY IF EXISTS "Public read active profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "School Admin can view school profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super Admin emergency access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_school_admin_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_teacher_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_parent_select_children" ON public.profiles;
DROP POLICY IF EXISTS "profiles_student_select_limited" ON public.profiles;

-- سياسات profiles الآمنة والمنضبطة
CREATE POLICY "profiles_own_read" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_own_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_super_admin_all" ON public.profiles
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "profiles_school_admin_select" ON public.profiles
  FOR SELECT USING (
    school_id = public.current_user_school_id()
    AND public.is_school_admin_or_principal(school_id)
  );

CREATE POLICY "profiles_teacher_select" ON public.profiles
  FOR SELECT USING (
    public.current_user_role() IN ('teacher', 'counselor')
    AND school_id = public.current_user_school_id()
    AND (
      role IN ('teacher', 'principal', 'vice_principal', 'counselor')
      OR EXISTS (
        SELECT 1 FROM public.teacher_assignments ta
        WHERE ta.teacher_id = auth.uid()
          AND ta.school_id = public.profiles.school_id
          AND (ta.class_id = public.profiles.class_id OR ta.student_id = public.profiles.id)
      )
    )
  );

CREATE POLICY "profiles_parent_select_children" ON public.profiles
  FOR SELECT USING (
    public.current_user_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM public.parent_student_relations psr
      WHERE psr.parent_id = auth.uid()
        AND psr.student_id = public.profiles.id
        AND psr.school_id = public.current_user_school_id()
    )
  );

CREATE POLICY "profiles_student_select_limited" ON public.profiles
  FOR SELECT USING (
    public.current_user_role() = 'student'
    AND school_id = public.current_user_school_id()
    AND (
      role IN ('teacher', 'principal', 'vice_principal', 'counselor')
      OR (
        role = 'student'
        AND class_id IS NOT NULL
        AND class_id = (SELECT class_id FROM public.profiles WHERE id = auth.uid())
      )
    )
  );

-- -------------------------------------------------------------------------
-- الخطوة 3: جداول المحادثات والرسائل المباشرة (Conversations & Direct Messages)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL,
    conversation_type TEXT NOT NULL DEFAULT 'direct',
    title TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_by_name TEXT,
    created_by_role TEXT,
    last_message TEXT,
    last_message_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    school_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    user_avatar TEXT,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ,
    CONSTRAINT unique_conversation_user UNIQUE (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    school_id TEXT NOT NULL,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    sender_avatar TEXT,
    text TEXT NOT NULL,
    attachment_name TEXT,
    attachment_url TEXT,
    problem_citation JSONB,
    homework_citation JSONB,
    is_deleted BOOLEAN DEFAULT false,
    deleted_by UUID,
    is_flagged BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow authenticated insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow authenticated update conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversations_select_member" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update" ON public.conversations;

CREATE POLICY "conversations_select_member" ON public.conversations
  FOR SELECT USING (
    school_id = public.current_user_school_id()
    AND (
      EXISTS (
        SELECT 1 FROM public.conversation_members cm
        WHERE cm.conversation_id = public.conversations.id
          AND cm.user_id = auth.uid()
      )
      OR public.is_school_admin_or_principal(school_id)
    )
  );

CREATE POLICY "conversations_insert" ON public.conversations
  FOR INSERT WITH CHECK (
    school_id = public.current_user_school_id()
    AND created_by = auth.uid()
  );

CREATE POLICY "conversations_update" ON public.conversations
  FOR UPDATE USING (
    school_id = public.current_user_school_id()
    AND (
      EXISTS (
        SELECT 1 FROM public.conversation_members cm
        WHERE cm.conversation_id = public.conversations.id
          AND cm.user_id = auth.uid()
      )
      OR public.is_school_admin_or_principal(school_id)
    )
  );

DROP POLICY IF EXISTS "Allow authenticated read conversation members" ON public.conversation_members;
DROP POLICY IF EXISTS "Allow authenticated insert conversation members" ON public.conversation_members;
DROP POLICY IF EXISTS "Allow authenticated update conversation members" ON public.conversation_members;
DROP POLICY IF EXISTS "conv_members_select" ON public.conversation_members;
DROP POLICY IF EXISTS "conv_members_insert" ON public.conversation_members;
DROP POLICY IF EXISTS "conv_members_update_own" ON public.conversation_members;

CREATE POLICY "conv_members_select" ON public.conversation_members
  FOR SELECT USING (
    school_id = public.current_user_school_id()
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.conversation_members cm2
        WHERE cm2.conversation_id = public.conversation_members.conversation_id
          AND cm2.user_id = auth.uid()
      )
      OR public.is_school_admin_or_principal(school_id)
    )
  );

CREATE POLICY "conv_members_insert" ON public.conversation_members
  FOR INSERT WITH CHECK (
    school_id = public.current_user_school_id()
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
          AND c.created_by = auth.uid()
      )
      OR public.is_school_admin_or_principal(school_id)
    )
  );

CREATE POLICY "conv_members_update_own" ON public.conversation_members
  FOR UPDATE USING (
    school_id = public.current_user_school_id()
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Allow authenticated read direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Allow authenticated insert direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Allow authenticated update direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "direct_messages_select" ON public.direct_messages;
DROP POLICY IF EXISTS "direct_messages_insert" ON public.direct_messages;
DROP POLICY IF EXISTS "direct_messages_update" ON public.direct_messages;

-- لا يمكن قراءة الرسائل إلا إذا كان المستخدم عضواً فعلياً في conversation_members
CREATE POLICY "direct_messages_select" ON public.direct_messages
  FOR SELECT USING (
    school_id = public.current_user_school_id()
    AND (
      EXISTS (
        SELECT 1 FROM public.conversation_members cm
        WHERE cm.conversation_id = public.direct_messages.conversation_id
          AND cm.user_id = auth.uid()
      )
      OR public.is_school_admin_or_principal(school_id)
    )
  );

-- لا يمكن إرسال رسالة إلا إذا كان عضواً مسجلاً في المحادثة وكاتب الرسالة هو نفسه
CREATE POLICY "direct_messages_insert" ON public.direct_messages
  FOR INSERT WITH CHECK (
    school_id = public.current_user_school_id()
    AND sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = public.direct_messages.conversation_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "direct_messages_update" ON public.direct_messages
  FOR UPDATE USING (
    school_id = public.current_user_school_id()
    AND (
      sender_id = auth.uid()
      OR public.is_school_admin_or_principal(school_id)
    )
  );

-- -------------------------------------------------------------------------
-- الخطوة 4: التذاكر الإدارية ورسائلها (Support Tickets & Ticket Messages)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    ticket_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    creator_name TEXT NOT NULL,
    creator_role TEXT NOT NULL DEFAULT 'student',
    creator_grade TEXT,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'متوسط',
    status TEXT NOT NULL DEFAULT 'جديد',
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id TEXT NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    school_id TEXT NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    sender_avatar TEXT,
    text TEXT NOT NULL,
    attachment_name TEXT,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read tickets in school" ON public.support_tickets;
DROP POLICY IF EXISTS "Allow authenticated insert tickets in school" ON public.support_tickets;
DROP POLICY IF EXISTS "Allow authenticated update tickets in school" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_select" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_insert" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_update" ON public.support_tickets;

-- الطالب أو ولي الأمر يرى تذاكره فقط، الإدارة والموجه يرى تذاكر المدرسة
CREATE POLICY "tickets_select" ON public.support_tickets
  FOR SELECT USING (
    school_id = public.current_user_school_id()
    AND (
      user_id = auth.uid()
      OR public.is_school_admin_or_principal(school_id)
      OR public.current_user_role() = 'counselor'
    )
  );

CREATE POLICY "tickets_insert" ON public.support_tickets
  FOR INSERT WITH CHECK (
    school_id = public.current_user_school_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "tickets_update" ON public.support_tickets
  FOR UPDATE USING (
    school_id = public.current_user_school_id()
    AND (
      user_id = auth.uid()
      OR public.is_school_admin_or_principal(school_id)
      OR public.current_user_role() = 'counselor'
    )
  );

DROP POLICY IF EXISTS "Allow authenticated read ticket messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Allow authenticated insert ticket messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "ticket_messages_select" ON public.ticket_messages;
DROP POLICY IF EXISTS "ticket_messages_insert" ON public.ticket_messages;

CREATE POLICY "ticket_messages_select" ON public.ticket_messages
  FOR SELECT USING (
    school_id = public.current_user_school_id()
    AND EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = ticket_messages.ticket_id
        AND (
          st.user_id = auth.uid()
          OR public.is_school_admin_or_principal(st.school_id)
          OR public.current_user_role() = 'counselor'
        )
    )
  );

CREATE POLICY "ticket_messages_insert" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    school_id = public.current_user_school_id()
    AND sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = ticket_messages.ticket_id
        AND (
          st.user_id = auth.uid()
          OR public.is_school_admin_or_principal(st.school_id)
          OR public.current_user_role() = 'counselor'
        )
    )
  );

-- -------------------------------------------------------------------------
-- الخطوة 5: غرف المذاكرة الجماعية (Study Rooms, Members, Messages)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_rooms (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    room_name TEXT NOT NULL,
    name TEXT NOT NULL,
    room_type TEXT NOT NULL DEFAULT 'فصل',
    subject_id TEXT,
    subject TEXT NOT NULL,
    grade_id TEXT,
    grade TEXT NOT NULL,
    class_id TEXT,
    created_by UUID REFERENCES auth.users(id),
    supervisor_id UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'active',
    members_count INTEGER DEFAULT 1,
    icon TEXT DEFAULT '🔬',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.study_room_members (
    room_id TEXT NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    member_role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_muted BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.study_room_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    school_id TEXT NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    sender_avatar TEXT,
    text TEXT NOT NULL,
    attachment_name TEXT,
    attachment_url TEXT,
    problem_citation JSONB,
    homework_citation JSONB,
    is_deleted BOOLEAN DEFAULT false,
    deleted_by UUID,
    is_flagged BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read study rooms in school" ON public.study_rooms;
DROP POLICY IF EXISTS "Allow authenticated manage study rooms in school" ON public.study_rooms;
DROP POLICY IF EXISTS "study_rooms_select" ON public.study_rooms;
DROP POLICY IF EXISTS "study_rooms_insert" ON public.study_rooms;
DROP POLICY IF EXISTS "study_rooms_manage" ON public.study_rooms;

CREATE POLICY "study_rooms_select" ON public.study_rooms
  FOR SELECT USING (
    school_id = public.current_user_school_id()
    AND NOT EXISTS (
      SELECT 1 FROM public.study_room_members srm
      WHERE srm.room_id = public.study_rooms.id
        AND srm.user_id = auth.uid()
        AND srm.is_banned IS TRUE
    )
  );

CREATE POLICY "study_rooms_insert" ON public.study_rooms
  FOR INSERT WITH CHECK (
    school_id = public.current_user_school_id()
    AND (
      public.current_user_role() IN ('teacher', 'principal', 'vice_principal', 'admin')
      OR public.is_school_admin_or_principal(school_id)
    )
  );

CREATE POLICY "study_rooms_manage" ON public.study_rooms
  FOR UPDATE USING (
    school_id = public.current_user_school_id()
    AND (
      created_by = auth.uid()
      OR supervisor_id = auth.uid()
      OR public.is_school_admin_or_principal(school_id)
    )
  );

DROP POLICY IF EXISTS "Allow authenticated read study room members" ON public.study_room_members;
DROP POLICY IF EXISTS "Allow authenticated manage study room members" ON public.study_room_members;
DROP POLICY IF EXISTS "study_room_members_select" ON public.study_room_members;
DROP POLICY IF EXISTS "study_room_members_insert" ON public.study_room_members;
DROP POLICY IF EXISTS "study_room_members_manage" ON public.study_room_members;

CREATE POLICY "study_room_members_select" ON public.study_room_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.study_rooms sr
      WHERE sr.id = public.study_room_members.room_id
        AND sr.school_id = public.current_user_school_id()
    )
  );

CREATE POLICY "study_room_members_insert" ON public.study_room_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.study_rooms sr
      WHERE sr.id = room_id
        AND sr.school_id = public.current_user_school_id()
    )
    AND (
      user_id = auth.uid()
      OR public.is_school_admin_or_principal(public.current_user_school_id())
    )
  );

CREATE POLICY "study_room_members_manage" ON public.study_room_members
  FOR UPDATE USING (
    public.is_school_admin_or_principal(public.current_user_school_id())
    OR EXISTS (
      SELECT 1 FROM public.study_rooms sr
      WHERE sr.id = room_id
        AND (sr.created_by = auth.uid() OR sr.supervisor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Allow authenticated read study room messages" ON public.study_room_messages;
DROP POLICY IF EXISTS "Allow authenticated insert study room messages" ON public.study_room_messages;
DROP POLICY IF EXISTS "Allow authenticated update study room messages" ON public.study_room_messages;
DROP POLICY IF EXISTS "study_room_messages_select" ON public.study_room_messages;
DROP POLICY IF EXISTS "study_room_messages_insert" ON public.study_room_messages;
DROP POLICY IF EXISTS "study_room_messages_update" ON public.study_room_messages;

-- قراءة الرسائل: عضو غير محظور في نفس المدرسة
CREATE POLICY "study_room_messages_select" ON public.study_room_messages
  FOR SELECT USING (
    school_id = public.current_user_school_id()
    AND EXISTS (
      SELECT 1 FROM public.study_room_members srm
      WHERE srm.room_id = public.study_room_messages.room_id
        AND srm.user_id = auth.uid()
        AND srm.is_banned IS NOT TRUE
    )
  );

-- إرسال الرسائل: عضو غير محظور وغير مكتوم
CREATE POLICY "study_room_messages_insert" ON public.study_room_messages
  FOR INSERT WITH CHECK (
    school_id = public.current_user_school_id()
    AND sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.study_room_members srm
      WHERE srm.room_id = public.study_room_messages.room_id
        AND srm.user_id = auth.uid()
        AND srm.is_banned IS NOT TRUE
        AND srm.is_muted IS NOT TRUE
    )
  );

CREATE POLICY "study_room_messages_update" ON public.study_room_messages
  FOR UPDATE USING (
    school_id = public.current_user_school_id()
    AND (
      sender_id = auth.uid()
      OR public.is_school_admin_or_principal(school_id)
    )
  );

-- -------------------------------------------------------------------------
-- الخطوة 6: ربط ولي الأمر بالطلاب (Parent-Student Relations)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parent_student_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL,
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL DEFAULT 'ولي أمر',
    parent_name TEXT,
    parent_phone TEXT,
    student_name TEXT,
    student_grade TEXT,
    student_class TEXT,
    status TEXT NOT NULL DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_school_parent_student UNIQUE (school_id, parent_id, student_id)
);

ALTER TABLE public.parent_student_relations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read parent student relations" ON public.parent_student_relations;
DROP POLICY IF EXISTS "parent_student_select" ON public.parent_student_relations;
DROP POLICY IF EXISTS "parent_student_manage_admin" ON public.parent_student_relations;

-- لا يمكن لأي مستخدم ربط نفسه بطلاب آخرين، القراءة للطرفين المعنيين فقط
CREATE POLICY "parent_student_select" ON public.parent_student_relations
  FOR SELECT USING (
    school_id = public.current_user_school_id()
    AND (
      parent_id = auth.uid()
      OR student_id = auth.uid()
      OR public.is_school_admin_or_principal(school_id)
    )
  );

-- الإنشاء والتعديل والحذف محصور بإدارة المدرسة أو Super Admin حصراً
CREATE POLICY "parent_student_manage_admin" ON public.parent_student_relations
  FOR ALL USING (
    public.is_school_admin_or_principal(school_id)
  )
  WITH CHECK (
    public.is_school_admin_or_principal(school_id)
  );

-- -------------------------------------------------------------------------
-- الخطوة 7: تكليفات المعلمين (Teacher Assignments)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    teacher_name TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    grade_name TEXT NOT NULL,
    classroom_name TEXT NOT NULL,
    class_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read teacher assignments" ON public.teacher_assignments;
DROP POLICY IF EXISTS "teacher_assignments_select" ON public.teacher_assignments;
DROP POLICY IF EXISTS "teacher_assignments_manage_admin" ON public.teacher_assignments;

CREATE POLICY "teacher_assignments_select" ON public.teacher_assignments
  FOR SELECT USING (
    school_id = public.current_user_school_id()
    AND (
      teacher_id = auth.uid()
      OR public.is_school_admin_or_principal(school_id)
      OR public.current_user_role() IN ('teacher', 'counselor')
      OR class_id = (SELECT class_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "teacher_assignments_manage_admin" ON public.teacher_assignments
  FOR ALL USING (
    public.is_school_admin_or_principal(school_id)
  )
  WITH CHECK (
    public.is_school_admin_or_principal(school_id)
  );

-- -------------------------------------------------------------------------
-- الخطوة 8: التعاميم والإعلانات المدرسية (Circulars & Announcements)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_circulars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL,
    title TEXT NOT NULL,
    circular_number TEXT,
    content TEXT NOT NULL,
    circular_type TEXT NOT NULL DEFAULT 'إداري',
    target_audience TEXT NOT NULL DEFAULT 'all_school',
    target_grade TEXT,
    target_class TEXT,
    target_user_ids JSONB DEFAULT '[]'::jsonb,
    priority TEXT NOT NULL DEFAULT 'عادي',
    requires_read_confirmation BOOLEAN DEFAULT false,
    attachment_name TEXT,
    attachment_url TEXT,
    publish_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    created_by_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_by_name TEXT NOT NULL,
    created_by_role TEXT NOT NULL DEFAULT 'principal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.circular_read_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circular_id UUID NOT NULL REFERENCES public.school_circulars(id) ON DELETE CASCADE,
    school_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    is_confirmed BOOLEAN DEFAULT false,
    CONSTRAINT unique_circular_user_read UNIQUE (circular_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.school_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_audience TEXT NOT NULL DEFAULT 'all_school',
    grade_name TEXT,
    classroom_name TEXT,
    created_by_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_by_name TEXT NOT NULL,
    created_by_role TEXT NOT NULL,
    is_urgent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.school_circulars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circular_read_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read circulars" ON public.school_circulars;
DROP POLICY IF EXISTS "circulars_select" ON public.school_circulars;
DROP POLICY IF EXISTS "circulars_manage_admin" ON public.school_circulars;

CREATE POLICY "circulars_select" ON public.school_circulars
  FOR SELECT USING (
    school_id = public.current_user_school_id()
    AND (
      public.is_school_admin_or_principal(school_id)
      OR target_audience = 'all_school'
      OR (target_audience = 'teachers' AND public.current_user_role() = 'teacher')
      OR (target_audience = 'students' AND public.current_user_role() = 'student')
      OR (target_audience = 'parents' AND public.current_user_role() = 'parent')
    )
  );

CREATE POLICY "circulars_manage_admin" ON public.school_circulars
  FOR ALL USING (
    public.is_school_admin_or_principal(school_id)
  )
  WITH CHECK (
    public.is_school_admin_or_principal(school_id)
  );

DROP POLICY IF EXISTS "Allow authenticated read circular confirmations" ON public.circular_read_confirmations;
DROP POLICY IF EXISTS "circular_confirm_select" ON public.circular_read_confirmations;
DROP POLICY IF EXISTS "circular_confirm_insert_own" ON public.circular_read_confirmations;

CREATE POLICY "circular_confirm_select" ON public.circular_read_confirmations
  FOR SELECT USING (
    school_id = public.current_user_school_id()
    AND (
      user_id = auth.uid()
      OR public.is_school_admin_or_principal(school_id)
    )
  );

CREATE POLICY "circular_confirm_insert_own" ON public.circular_read_confirmations
  FOR INSERT WITH CHECK (
    school_id = public.current_user_school_id()
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Allow authenticated read announcements" ON public.school_announcements;
DROP POLICY IF EXISTS "announcements_select" ON public.school_announcements;
DROP POLICY IF EXISTS "announcements_manage_admin" ON public.school_announcements;

CREATE POLICY "announcements_select" ON public.school_announcements
  FOR SELECT USING (
    school_id = public.current_user_school_id()
    AND (
      public.is_school_admin_or_principal(school_id)
      OR target_audience = 'all_school'
      OR (target_audience = 'teachers' AND public.current_user_role() = 'teacher')
      OR (target_audience = 'students' AND public.current_user_role() = 'student')
      OR (target_audience = 'parents' AND public.current_user_role() = 'parent')
    )
  );

CREATE POLICY "announcements_manage_admin" ON public.school_announcements
  FOR ALL USING (
    public.is_school_admin_or_principal(school_id)
  )
  WITH CHECK (
    public.is_school_admin_or_principal(school_id)
  );

-- -------------------------------------------------------------------------
-- الخطوة 9: الإشعارات المباشرة (Notifications)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'message',
    target_id TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_admin" ON public.notifications;

-- المستخدم يرى إشعاراته هو فقط داخل مدرسته
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (
    school_id = public.current_user_school_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (
    school_id = public.current_user_school_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "notifications_insert_admin" ON public.notifications
  FOR INSERT WITH CHECK (
    public.is_school_admin_or_principal(school_id)
  );

-- -------------------------------------------------------------------------
-- الخطوة 10: سجلات الرقابة والتدقيق (Moderation Audit Logs)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.moderation_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT,
    action TEXT NOT NULL,
    target_user TEXT,
    details TEXT NOT NULL,
    severity TEXT DEFAULT 'متوسط',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.moderation_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read audit logs" ON public.moderation_audit_logs;
DROP POLICY IF EXISTS "Allow authenticated insert audit logs" ON public.moderation_audit_logs;
DROP POLICY IF EXISTS "audit_logs_select" ON public.moderation_audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.moderation_audit_logs;

CREATE POLICY "audit_logs_select" ON public.moderation_audit_logs
  FOR SELECT USING (
    school_id = public.current_user_school_id()
    AND (
      public.is_school_admin_or_principal(school_id)
      OR public.current_user_role() = 'counselor'
    )
  );

CREATE POLICY "audit_logs_insert" ON public.moderation_audit_logs
  FOR INSERT WITH CHECK (
    school_id = public.current_user_school_id()
  );

-- -------------------------------------------------------------------------
-- الخطوة 11: تمكين Realtime بشكل آمن وبدون أخطاء تكرار الجداول
-- -------------------------------------------------------------------------
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'support_tickets',
    'ticket_messages',
    'conversations',
    'conversation_members',
    'direct_messages',
    'study_rooms',
    'study_room_members',
    'study_room_messages',
    'moderation_audit_logs',
    'school_circulars',
    'circular_read_confirmations',
    'school_announcements',
    'notifications'
  ];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOREACH tbl IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = tbl
    ) THEN
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipping table % in publication: %', tbl, SQLERRM;
      END;
    END IF;
  END LOOP;
END $$;
