import React, { useState, useEffect, useMemo } from 'react';
import { CurriculumBook, StudentProfile, StudentQuizResult, StudentChallengeBadge } from '../types';
import { CurriculumBookCover } from './CurriculumBookCover';
import {
  X,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  RotateCcw,
  Sparkles,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  HelpCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Check
} from 'lucide-react';

export interface QuizQuestionItem {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic?: string;
  difficulty?: 'سهل' | 'متوسط' | 'متقدم';
}

interface QuizModalProps {
  book: CurriculumBook | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenBookDetail?: (book: CurriculumBook) => void;
  onOpenSmartTeacher?: (subject: string, grade: string, topic: string) => void;
  studentProfile?: StudentProfile;
  onUpdateStudentProfile?: (updatedProfile: StudentProfile) => void;
  onSaveQuizResult?: (result: StudentQuizResult, updatedProfile: StudentProfile) => void;
  onNavigateToDashboard?: () => void;
}

/**
 * Intelligent Question Generator for Saudi Curriculum Textbooks
 * Produces exactly 5 syllabus-accurate multiple choice questions
 * based on subject, stage, grade, and chapter contents.
 */
function generateCurriculumQuizQuestions(book: CurriculumBook, round: number = 0): QuizQuestionItem[] {
  const subject = (book.subject || book.subject_name || book.title || '').trim();
  const title = (book.title || book.book_name || '').trim();
  const grade = (book.grade || '').trim();
  const chapterTitles = book.chapters?.map((c) => c.title) || [];
  const lessonTopics = book.chapters?.flatMap((c) => c.topics || c.lessons?.flatMap((l) => l.topics) || []) || [];

  // 1. MATHEMATICS (الرياضيات)
  if (subject.includes('رياضيات') || title.includes('الرياضيات') || subject.includes('جبر') || subject.includes('هندسة')) {
    const isPrimary = book.stage === 'primary' || grade.includes('الابتدائي');
    const isSecondary = book.stage === 'secondary' || grade.includes('الثانوي');

    if (isPrimary) {
      const bank: QuizQuestionItem[][] = [
        [
          {
            id: 'math-p-1',
            question: 'ما ناتج جمع: ٤٥ + ٣٧ ؟',
            options: ['٧٢', '٨٢', '٨٥', '٧٧'],
            correctAnswer: 1,
            explanation: 'نجمع الآحاد ٥ + ٧ = ١٢ (٢ ونعيد تجميع ١)، ثم العشرات ١ + ٤ + ٣ = ٨، إذن الناتج ٨٢.',
            topic: 'الجمع وإعادة التجميع',
            difficulty: 'سهل'
          },
          {
            id: 'math-p-2',
            question: 'ما القيمة المنزلية للرقم ٧ في العدد ٥,٧٢٠ ؟',
            options: ['٧', '٧٠', '٧٠٠', '٧٠٠٠'],
            correctAnswer: 2,
            explanation: 'الرقم ٧ يقع في منزلة المئات، وبالتالي قيمته المنزلية هي ٧٠٠.',
            topic: 'القيمة المنزلية',
            difficulty: 'سهل'
          },
          {
            id: 'math-p-3',
            question: 'أي من الأشكال الآتية له ٤ أضلاع متطابقة و ٤ زوايا قائمة؟',
            options: ['المستطيل', 'المثلث', 'المربع', 'متوازي الأضلاع'],
            correctAnswer: 2,
            explanation: 'المربع هو الشكل الرباعي الوحيد الذي تتطابق جميع أضلاعه الأربعة وتكون جميع زواياه قائمة.',
            topic: 'الأشكال الهندسية',
            difficulty: 'متوسط'
          },
          {
            id: 'math-p-4',
            question: 'مستطيل طوله ٦ سم وعرضه ٤ سم، فما مساحته؟',
            options: ['١٠ سم²', '٢٠ سم²', '٢٤ سم²', '١٦ سم²'],
            correctAnswer: 2,
            explanation: 'مساحة المستطيل = الطول × العرض = ٦ × ٤ = ٢٤ سم².',
            topic: 'القياس والمساحة',
            difficulty: 'متوسط'
          },
          {
            id: 'math-p-5',
            question: 'ما الكسر الدال على الجزء المظلل إذا قسّمنا شكلاً إلى ٨ أجزاء وظللنا ٣ منها؟',
            options: ['٣/٨', '٥/٨', '٨/٣', '١/٢'],
            correctAnswer: 0,
            explanation: 'الكسر يتكون من بسط (الأجزاء المظللة = ٣) ومقام (مجموع الأجزاء الكلي = ٨)، فيكون الكسر ٣/٨.',
            topic: 'الكسور الاعتيادية',
            difficulty: 'سهل'
          }
        ],
        [
          {
            id: 'math-p-alt-1',
            question: 'ما ناتج ضرب: ٧ × ٨ ؟',
            options: ['٥٤', '٥٦', '٦٤', '٤٨'],
            correctAnswer: 1,
            explanation: 'وفق جدول الضرب المعتمد: ٧ × ٨ = ٥٦.',
            topic: 'جدول الضرب',
            difficulty: 'سهل'
          },
          {
            id: 'math-p-alt-2',
            question: 'محيط حديقة مربعة طول ضلعها ٩ أمتار هو:',
            options: ['١٨ م', '٢٧ م', '٣٦ م', '٨١ م'],
            correctAnswer: 2,
            explanation: 'محيط المربع = طول الضلع × ٤ = ٩ × ٤ = ٣٦ متراً.',
            topic: 'محيط المضلعات',
            difficulty: 'متوسط'
          },
          {
            id: 'math-p-alt-3',
            question: 'إذا كان مع فهد ٥٠ ريالاً واشترى كتاباً بـ ٢٨ ريالاً، فكم تبقى معه؟',
            options: ['٢٢ ريالاً', '٣٢ ريالاً', '١٨ ريالاً', '٢٥ ريالاً'],
            correctAnswer: 0,
            explanation: 'نطرح: ٥٠ - ٢٨ = ٢٢ ريالاً.',
            topic: 'مسائل الطرح اللفظية',
            difficulty: 'سهل'
          },
          {
            id: 'math-p-alt-4',
            question: 'الكسر المكافئ للكسر ١/٢ هو:',
            options: ['٢/٦', '٣/٦', '٤/١٠', '٥/٨'],
            correctAnswer: 1,
            explanation: 'بضرب البسط والمقام في ٣ نحصل على ٣/٦ وهو مكافئ تماماً لـ ١/٢.',
            topic: 'الكسور المتكافئة',
            difficulty: 'متوسط'
          },
          {
            id: 'math-p-alt-5',
            question: 'الوحدة الأنسب لقياس المسافة بين الرياض ومكة المكرمة هي:',
            options: ['الملمتر', 'السنتيمتر', 'المتر', 'الكيلومتر'],
            correctAnswer: 3,
            explanation: 'تُقاس المسافات الطويلة بين المدن بوحدة الكيلومتر (كم).',
            topic: 'وحدات القياس',
            difficulty: 'سهل'
          }
        ]
      ];
      return bank[round % bank.length];
    } else if (isSecondary) {
      return [
        {
          id: 'math-s-1',
          question: 'ما مجال الدالة: f(x) = √(x - ٤) في مجموعة الأعداد الحقيقية؟',
          options: ['x > ٤', 'x ≥ ٤', 'x ≤ ٤', 'كل الأعداد الحقيقية'],
          correctAnswer: 1,
          explanation: 'يجب أن يكون ما تحت الجذر غير سالب: x - ٤ ≥ ٠ وبالتالي x ≥ ٤.',
          topic: 'مجال الدوال الجذرية',
          difficulty: 'متوسط'
        },
        {
          id: 'math-s-2',
          question: 'ما قيمة المشتقة الأولى للدالة f(x) = ٣x² + ٥x - ٧ عند أي نقطة x؟',
          options: ['٦x + ٥', '٣x + ٥', '٦x - ٧', 'x + ٥'],
          correctAnswer: 0,
          explanation: 'مشتقة ٣x² هي ٦x، ومشتقة ٥x هي ٥، ومشتقة الثابت صفر، فالناتج ٦x + ٥.',
          topic: 'قواعد الاشتقاق',
          difficulty: 'متوسط'
        },
        {
          id: 'math-s-3',
          question: 'في المتتابعة الحسابية التي حدها الأول a₁ = ٥ وأساسها d = ٣، ما قيمة الحد العاشر a₁₀؟',
          options: ['٣٢', '٣٥', '٣٨', '٢٩'],
          correctAnswer: 0,
          explanation: 'القانون: a_n = a₁ + (n - 1)d = ٥ + (٩ × ٣) = ٥ + ٢٧ = ٣٢.',
          topic: 'المتتابعات الحسابية',
          difficulty: 'متقدم'
        },
        {
          id: 'math-s-4',
          question: 'ما قيمة الزاوية sin(٩٠°) في دائرة الوحدة؟',
          options: ['٠', '١', '-١', '٠.٥'],
          correctAnswer: 1,
          explanation: 'في دائرة الوحدة، النقطة المقابلة لزاوية ٩٠° هي (٠، ١)، وبالتالي sin(٩٠°) = ١.',
          topic: 'حساب المثلثات',
          difficulty: 'سهل'
        },
        {
          id: 'math-s-5',
          question: 'حجم المنشور الرباعي الذي أبعاده ٤ سم، ٥ سم، و ٣ سم يساوي:',
          options: ['٦٠ سم³', '٣٦ سم³', '٤٥ سم³', '١٢ سم³'],
          correctAnswer: 0,
          explanation: 'الحجم = الطول × العرض × الارتفاع = ٤ × ٥ × ٣ = ٦٠ سم³.',
          topic: 'الهندسة الفضائية',
          difficulty: 'متوسط'
        }
      ];
    } else {
      // Middle Stage (المتوسط)
      return [
        {
          id: 'math-m-1',
          question: 'حل المعادلة الخطية: ٢س + ٥ = ١٣ هو س =',
          options: ['٣', '٤', '٥', '٦'],
          correctAnswer: 1,
          explanation: 'بطرح ٥ من الطرفين: ٢س = ٨، وبالقسمة على ٢ نجد س = ٤.',
          topic: 'المعادلات ذات الخطوتين',
          difficulty: 'سهل'
        },
        {
          id: 'math-m-2',
          question: 'ما قيمة الزاوية المجهولة في مثلث إذا علمت أن قياس زاويتيه الأخريين ٦٠° و ٧٠°؟',
          options: ['٥٠°', '٦٠°', '٤٠°', '٣٠°'],
          correctAnswer: 0,
          explanation: 'مجموع زوايا المثلث ١٨٠°. إذن: ١٨٠ - (٦٠ + ٧٠) = ١٨٠ - ١٣٠ = ٥٠°.',
          topic: 'خواص المثلثات',
          difficulty: 'سهل'
        },
        {
          id: 'math-m-3',
          question: 'ما النسبة المئوية للعدد ١٥ من أصل ٦٠؟',
          options: ['١٥%', '٢٠%', '٢٥%', '٣٠%'],
          correctAnswer: 2,
          explanation: '١٥ / ٦٠ = ١/٤ = ٠.٢٥ = ٢٥%.',
          topic: 'النسبة المئوية وتطبيقاتها',
          difficulty: 'متوسط'
        },
        {
          id: 'math-m-4',
          question: 'في نظرية فيثاغورس، إذا كان طولا ضلعي القائمة ٣ سم و ٤ سم، فإن طول الوتر يساوي:',
          options: ['٥ سم', '٦ سم', '٧ سم', '٢٥ سم'],
          correctAnswer: 0,
          explanation: 'جـ² = أ² + ب² = ٩ + ١٦ = ٢٥، وبأخذ الجذر التربيعي يكون الوتر = ٥ سم.',
          topic: 'نظرية فيثاغورس',
          difficulty: 'متوسط'
        },
        {
          id: 'math-m-5',
          question: 'ما الوسيط لمجموعة البيانات الآتية: ٤، ٧، ٩، ١٢، ١٥؟',
          options: ['٧', '٩', '١٢', '٩.٤'],
          correctAnswer: 1,
          explanation: 'البيانات مرتبة تصاعدياً، والقيمة الواقعة في المنتصف تماماً هي ٩.',
          topic: 'مقاييس النزعة المركزية',
          difficulty: 'سهل'
        }
      ];
    }
  }

  // 2. SCIENCE & PHYSICS / CHEMISTRY / BIOLOGY (العلوم / الفيزياء / الكيمياء / الأحياء)
  if (
    subject.includes('علوم') ||
    title.includes('العلوم') ||
    subject.includes('فيزياء') ||
    subject.includes('كيمياء') ||
    subject.includes('أحياء')
  ) {
    return [
      {
        id: 'sci-1',
        question: 'ما العضية الخلوية المسؤولة عن إنتاج الطاقة في الخلية وتسمى "محطة توليد الطاقة"؟',
        options: ['النواة', 'الميتوكندريا', 'جهاز جولجي', 'الغشاء البلازمي'],
        correctAnswer: 1,
        explanation: 'الميتوكندريا هي المسؤولة عن التنفس الخلوي وتحويل الغذاء إلى جزيئات ATP الحاملة للطاقة.',
        topic: 'تركيب الخلية ووظائفها',
        difficulty: 'سهل'
      },
      {
        id: 'sci-2',
        question: 'أي من التغيرات التالية يُعد تغيراً كيميائياً؟',
        options: ['ذوبان السكر في الماء', 'انصهار الجليد', 'صدأ مسمار الحديد', 'تمزيق ورقة'],
        correctAnswer: 2,
        explanation: 'صدأ الحديد يُنتج مادة جديدة (أكسيد الحديد) تختلف في خواصها الكيميائية عن الحديد الأصلي.',
        topic: 'التغيرات الفيزيائية والكيميائية',
        difficulty: 'متوسط'
      },
      {
        id: 'sci-3',
        question: 'وحدة قياس القوة في النظام الدولي للوحدات (SI) هي:',
        options: ['الجول', 'الواط', 'النيوتن', 'الباسكال'],
        correctAnswer: 2,
        explanation: 'تُقاس القوة بوحدة النيوتن (N) تخليداً للعالم إسحاق نيوتن واضع قوانين الحركة.',
        topic: 'القوى والحركة',
        difficulty: 'سهل'
      },
      {
        id: 'sci-4',
        question: 'الغاز الذي يستهلكه النبات أثناء عملية البناء الضوئي هو:',
        options: ['الأكسجين', 'ثاني أكسيد الكربون', 'النيتروجين', 'الهيدروجين'],
        correctAnswer: 1,
        explanation: 'يمتص النبات غاز ثاني أكسيد الكربون مع الماء وضوء الشمس لإنتاج سكر الجلوكوز والأكسجين.',
        topic: 'البناء الضوئي وسلاسل الغذاء',
        difficulty: 'سهل'
      },
      {
        id: 'sci-5',
        question: 'ما هو القانون العلمي الذي ينص على أن "المادة لا تفنى ولا تستحدث من العدم بل تتحول من شكل لآخر"؟',
        options: ['قانون حفظ الكتلة', 'قانون نيوتن الأول', 'قانون أوم', 'قانون باسكال'],
        correctAnswer: 0,
        explanation: 'قانون حفظ الكتلة (أو حفظ المادة) ينص على ثبات إجمالي كتلة المواد قبل وبعد التفاعل.',
        topic: 'القوانين العلمية وحفظ المادة',
        difficulty: 'متوسط'
      }
    ];
  }

  // 3. ARABIC LANGUAGE (لغتي الجميلة / اللغة العربية / الكفايات)
  if (
    subject.includes('لغتي') ||
    subject.includes('عربي') ||
    title.includes('لغتي') ||
    subject.includes('كفايات')
  ) {
    return [
      {
        id: 'arb-1',
        question: 'في جملة (تَفَوَّقَ الطَّالِبُ المُجْتَهِدُ)، ما الموقع الإعرابي لكلمة "الطالبُ"؟',
        options: ['مبتدأ مرفوع', 'فاعل مرفوع وعلامة رفعه الضمة', 'مفعول به منصوب', 'خبر مرفوع'],
        correctAnswer: 1,
        explanation: 'الفاعل هو من قام بالفعل (التفوق)، ويكون دائماً مرفوعاً، وهنا علامته الضمة الظاهرة.',
        topic: 'الفاعل وأركان الجملة الفعلية',
        difficulty: 'سهل'
      },
      {
        id: 'arb-2',
        question: 'أي من الكلمات الآتية كُتبت فيها الهمزة همزةَ وصل صحيحة؟',
        options: ['إِكرام', 'أَحمد', 'اسْتِغْفار', 'أُسرة'],
        correctAnswer: 2,
        explanation: 'كلمة (استغفار) مصدر لفعل سداسي (استغفر)، وهمزة ماضي وأمر ومصدر السداسي والخماسي هي همزة وصل.',
        topic: 'قواعد الإملاء - همزتا الوصل والقطع',
        difficulty: 'متوسط'
      },
      {
        id: 'arb-3',
        question: 'ما جمع التكسير الصحيح لكلمة (قَلَم)؟',
        options: ['قلمان', 'أقلام', 'قلمون', 'مقالم'],
        correctAnswer: 1,
        explanation: 'جمع التكسير يكسر بنية المفرد، وجمع قلم هو أقلام على وزن أفعال.',
        topic: 'أنواع الجموع في اللغة العربية',
        difficulty: 'سهل'
      },
      {
        id: 'arb-4',
        question: 'الحرف الناسخ الذي يفيد "التمني" هو:',
        options: ['إنَّ', 'كأنَّ', 'لَيْتَ', 'لَعَلَّ'],
        correctAnswer: 2,
        explanation: '(ليت) تفيد التمني للشيء المستحيل أو العسير، بينما (لعل) تفيد الرجاء، و(كأن) تفيد التشبيه.',
        topic: 'إنّ وأخواتها ومعاني الحروف الناسخة',
        difficulty: 'متوسط'
      },
      {
        id: 'arb-5',
        question: 'ما المترادف الأدق لكلمة (شَاهِق) في قولنا: (جبلٌ شاهقٌ)؟',
        options: ['صغير', 'مُرتفع وعالٍ', 'منبسط', 'وعر'],
        correctAnswer: 1,
        explanation: 'الشاهق في المعاجم العربية يعني شديد الارتفاع والعلو.',
        topic: 'الثروة اللغوية والترادف',
        difficulty: 'سهل'
      }
    ];
  }

  // 4. ISLAMIC STUDIES & TAJWEED (الدراسات الإسلامية / التوحيد / الفقه / التفسير / التجويد)
  if (
    subject.includes('إسلام') ||
    subject.includes('توحيد') ||
    subject.includes('فقه') ||
    subject.includes('تفسير') ||
    subject.includes('حديث') ||
    subject.includes('تجويد') ||
    title.includes('الإسلامية')
  ) {
    return [
      {
        id: 'isl-1',
        question: 'ما هو الركن الأول والأعظم من أركان الإسلام الخمسة؟',
        options: ['إقام الصلاة', 'إيتاء الزكاة', 'شهادة أن لا إله إلا الله وأن محمداً رسول الله', 'صوم رمضان'],
        correctAnswer: 2,
        explanation: 'قال النبي ﷺ: "بني الإسلام على خمس: شهادة أن لا إله إلا الله وأن محمداً رسول الله...".',
        topic: 'أركان الإسلام',
        difficulty: 'سهل'
      },
      {
        id: 'isl-2',
        question: 'توحيد الله بأفعاله كالخلق والرزق والإحياء والإماتة يُسمى:',
        options: ['توحيد الألوهية', 'توحيد الربوبية', 'توحيد الأسماء والصفات', 'الإحسان'],
        correctAnswer: 1,
        explanation: 'توحيد الربوبية هو إفراد الله بأفعاله سبحانه كالخلق والملك والتدبير والرزق.',
        topic: 'أقسام التوحيد',
        difficulty: 'سهل'
      },
      {
        id: 'isl-3',
        question: 'ما حكم صلاة الجماعة للرجال في المسجد في المعتمد في الفقه الإسلامي بالمملكة؟',
        options: ['واجبة', 'مستحبة', 'مباحة', 'سنة مؤكدة فقط'],
        correctAnswer: 0,
        explanation: 'صلاة الجماعة في المسجد واجبة على الرجال القادرين لقوله تعالى: ﴿وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَارْكَعُوا مَعَ الرَّاكِعِينَ﴾.',
        topic: 'أحكام الصلاة',
        difficulty: 'متوسط'
      },
      {
        id: 'isl-4',
        question: 'من أحكام النون الساكنة والتنوين: إذا جاء بعدهما أحد حروف (ي ر م ل و ن) فالحكم هو:',
        options: ['الإظهار الحلقي', 'الإدغام', 'الإقلاب', 'الإخفاء الحقيقي'],
        correctAnswer: 1,
        explanation: 'حروف الإدغام ستة مجموعة في كلمة (يرملون)، وتُدغم النون الساكنة أو التنوين إذا جاء بعدها حرف منها.',
        topic: 'أحكام التجويد - النون الساكنة والتنوين',
        difficulty: 'متوسط'
      },
      {
        id: 'isl-5',
        question: 'خاتم الأنبياء والمرسلين الذي أُرسل رحمة للعالمين هو:',
        options: ['إبراهيم عليه السلام', 'موسى عليه السلام', 'عيسى عليه السلام', 'محمد صلى الله عليه وسلم'],
        correctAnswer: 3,
        explanation: 'نبينا محمد ﷺ هو خاتم النبيين ورسالته عامة للناس كافة.',
        topic: 'السيرة النبوية والعقيدة',
        difficulty: 'سهل'
      }
    ];
  }

  // 5. SOCIAL STUDIES & HISTORY (الدراسات الاجتماعية / التاريخ والوطنية)
  if (
    subject.includes('اجتماع') ||
    subject.includes('تاريخ') ||
    subject.includes('جغرافيا') ||
    title.includes('الاجتماعية')
  ) {
    return [
      {
        id: 'soc-1',
        question: 'تم تأسيس الدولة السعودية الأولى على يد الإمام محمد بن سعود عام:',
        options: ['١١٣٩هـ (١٧٢٧م)', '١١٥٧هـ', '١٣١٩هـ', '١٣٥١هـ'],
        correctAnswer: 0,
        explanation: 'تأسست الدولة السعودية الأولى في عام ١١٣٩هـ (١٧٢٧م) وعاصمتها الدرعية، وهو تاريخ الاحتفاء بيوم التأسيس.',
        topic: 'يوم التأسيس والدولة السعودية الأولى',
        difficulty: 'سهل'
      },
      {
        id: 'soc-2',
        question: 'أعلن الملك عبدالعزيز آل سعود -رحمه الله- توحيد المملكة العربية السعودية عام:',
        options: ['١٣١٩هـ', '١٣٤٣هـ', '١٣٥١هـ (١٩٣٢م)', '١٣٧٣هـ'],
        correctAnswer: 2,
        explanation: 'صدر المرسوم الملكي بتوحيد البلاد تحت اسم (المملكة العربية السعودية) في ٢١ جمادى الأولى ١٣٥١هـ (٢٣ سبتمبر ١٩٣٢م).',
        topic: 'توحيد المملكة واليوم الوطني',
        difficulty: 'سهل'
      },
      {
        id: 'soc-3',
        question: 'عاصمة المملكة العربية السعودية ومركزها السياسي والإداري هي مدينة:',
        options: ['جدة', 'الرياض', 'الدمام', 'مكة المكرمة'],
        correctAnswer: 1,
        explanation: 'الرياض هي عاصمة المملكة العربية السعودية ومقر الحكم والمؤسسات الوطنية المركزية.',
        topic: 'جغرافية المملكة ومدنها',
        difficulty: 'سهل'
      },
      {
        id: 'soc-4',
        question: 'رؤية السعودية 2030 ترتكز على ثلاثة محاور رئيسية، منها:',
        options: ['مجتمع حيوي، اقتصاد مزدهر، وطن طموح', 'التوسع الزراعي فقط', 'الاستيراد الخارجي', 'الاعتماد الكلي على النفط'],
        correctAnswer: 0,
        explanation: 'محاور رؤية المملكة 2030 الأساسية هي: مجتمع حيوي، واقتصاد مزدهر، ووطن طموح.',
        topic: 'رؤية المملكة 2030',
        difficulty: 'متوسط'
      },
      {
        id: 'soc-5',
        question: 'المسطح المائي الذي يحد المملكة العربية السعودية من جهة الغرب هو:',
        options: ['الخليج العربي', 'بحر العرب', 'البحر الأحمر', 'المحيط الهندي'],
        correctAnswer: 2,
        explanation: 'يحد المملكة غرباً البحر الأحمر بساحل طويل يمتد لمسافة تزيد عن ١٨٠٠ كم.',
        topic: 'حدود المملكة وتضاريسها',
        difficulty: 'سهل'
      }
    ];
  }

  // 6. DIGITAL SKILLS & COMPUTER (المهارات الرقمية / التقنية الرقمية / الحاسب)
  if (
    subject.includes('رقمية') ||
    subject.includes('حاسب') ||
    subject.includes('تقنية') ||
    title.includes('الرقمية') ||
    title.includes('الحاسب')
  ) {
    return [
      {
        id: 'dig-1',
        question: 'الجزء في الحاسب المسؤول عن معالجة البيانات وتنفيذ التعليمات الحسابية والمنطقية هو:',
        options: ['الشاشة', 'وحدة المعالجة المركزية (CPU)', 'القرص الصلب', 'لوحة المفاتيح'],
        correctAnswer: 1,
        explanation: 'وحدة المعالجة المركزية (CPU) تُعد بمثابة العقل المفكر للحاسب وتقوم بمعالجة جميع الأوامر.',
        topic: 'مكونات الحاسب الآلي العتادية',
        difficulty: 'سهل'
      },
      {
        id: 'dig-2',
        question: 'سلسلة من الخطوات المنطقية المتسلسلة والمحددة لحل مشكلة معينة تُسمى:',
        options: ['الخوارزمية (Algorithm)', 'المتغير', 'قاعدة البيانات', 'الشبكة'],
        correctAnswer: 0,
        explanation: 'الخوارزمية هي مجموعة من الخطوات المرتبة منطقياً لحل مسألة معينة بدقة.',
        topic: 'مفاهيم البرمجة والخوارزميات',
        difficulty: 'سهل'
      },
      {
        id: 'dig-3',
        question: 'لحماية حساباتك الرقمية من الاختراق، يُنصح دائماً بـ:',
        options: ['استخدام كلمة مرور سهلة مثل 123456', 'تفعيل التحقق الثنائي (2FA) واستخدام كلمات مرور قوية', 'مشاركة كلمة المرور مع الأصدقاء', 'حفظ كلمات المرور على ورقة عامة'],
        correctAnswer: 1,
        explanation: 'التحقق الثنائي وإعداد كلمات مرور معقدة يوفران طبقة حماية متقدمة ضد هجمات التصيد والاختراق.',
        topic: 'الأمن السيبراني والمواطنة الرقمية',
        difficulty: 'متوسط'
      },
      {
        id: 'dig-4',
        question: 'أي من البرامج التالية يُستخدم بشكل مخصص لمعالجة الجداول الحسابية والرسوم البيانية؟',
        options: ['مايكروسوفت إكسل (Excel)', 'مايكروسوفت وورد (Word)', 'مايكروسوفت باوربوينت (PowerPoint)', 'الرسام'],
        correctAnswer: 0,
        explanation: 'برنامج Excel مخصص لتنظيم البيانات الرقمية، وإجراء العمليات الحسابية، وتصميم المخططات.',
        topic: 'التطبيقات المكتبية وإدارة البيانات',
        difficulty: 'سهل'
      },
      {
        id: 'dig-5',
        question: 'شبكة تربط بين مليارات الأجهزة حول العالم لمشاركة المعلومات تُعرف بـ:',
        options: ['الشبكة المحلية (LAN)', 'الإنترنت (Internet)', 'البلوتوث', 'الحوسبة السحابية'],
        correctAnswer: 1,
        explanation: 'الإنترنت هو الشبكة العالمية الواسعة التي تربط الحواسيب والخوادم في شتى بقاع الأرض.',
        topic: 'الشبكات والاتصالات الرقمية',
        difficulty: 'سهل'
      }
    ];
  }

  // 7. ENGLISH LANGUAGE (اللغة الإنجليزية / We Can / Super Goal / Mega Goal)
  if (
    subject.toLowerCase().includes('english') ||
    title.toLowerCase().includes('english') ||
    title.toLowerCase().includes('goal') ||
    title.toLowerCase().includes('we can')
  ) {
    return [
      {
        id: 'eng-1',
        question: 'Choose the correct verb: "Sara and Nora ______ reading a story now."',
        options: ['is', 'are', 'am', 'was'],
        correctAnswer: 1,
        explanation: 'The subject "Sara and Nora" is plural, so we use the plural auxiliary verb "are" in the present continuous.',
        topic: 'Subject-Verb Agreement',
        difficulty: 'سهل'
      },
      {
        id: 'eng-2',
        question: 'What is the opposite of the word "Difficult"?',
        options: ['Hard', 'Easy', 'Heavy', 'Fast'],
        correctAnswer: 1,
        explanation: '"Easy" is the direct antonym of "Difficult" (صعب وعكسه سهل).',
        topic: 'Vocabulary & Antonyms',
        difficulty: 'سهل'
      },
      {
        id: 'eng-3',
        question: 'Complete the sentence: "Yesterday, Ali ______ to school by bus."',
        options: ['go', 'goes', 'went', 'going'],
        correctAnswer: 2,
        explanation: 'The word "Yesterday" signals the past simple tense, so the past form of "go" is "went".',
        topic: 'Past Simple Tense',
        difficulty: 'متوسط'
      },
      {
        id: 'eng-4',
        question: 'Which of the following is a polite greeting used in the morning?',
        options: ['Good morning', 'Good night', 'Goodbye', 'See you later'],
        correctAnswer: 0,
        explanation: '"Good morning" is the standard formal and friendly greeting used before noon.',
        topic: 'Daily Greetings & Expressions',
        difficulty: 'سهل'
      },
      {
        id: 'eng-5',
        question: 'Choose the correct pronoun: "Ahmed loves sports. ______ plays football every day."',
        options: ['She', 'He', 'They', 'It'],
        correctAnswer: 1,
        explanation: 'Ahmed is a singular male noun, so the suitable personal subject pronoun is "He".',
        topic: 'Pronouns',
        difficulty: 'سهل'
      }
    ];
  }

  // 8. DYNAMIC FALLBACK / GENERAL BOOK TOPICS (for custom or specialized uploaded books)
  // Extracts real context from chapter titles and topics
  const ch1 = chapterTitles[0] || 'المفاهيم التأسيسية للمقرر';
  const ch2 = chapterTitles[1] || 'التطبيقات العملية والشواهد';
  const ch3 = chapterTitles[2] || 'المهارات والأنشطة الإثرائية';
  const topic1 = lessonTopics[0] || 'الهدف التعليمي العام للكتاب';

  return [
    {
      id: `gen-1-${book.id}`,
      question: `ما هو المحور الأساسي الذي يركز عليه فصل: "${ch1}" في هذا المقرر؟`,
      options: [
        `بناء المعارف والمفاهيم التأسيسية لموضوع (${subject})`,
        'سرد تواريخ الأحداث غير المتعلقة بالمقرر',
        'تجاهل التطبيقات العملية والمسائل التدريبية',
        'إلغاء المكتسبات السابقة للطلاب'
      ],
      correctAnswer: 0,
      explanation: `يركز هذا الفصل على بناء المعارف الجوهرية والمهارات التأسيسية وفق الإطار المنهجي المعتمد لكتاب ${title}.`,
      topic: ch1,
      difficulty: 'سهل'
    },
    {
      id: `gen-2-${book.id}`,
      question: `وفق محتوى كتاب (${title})، ما الطريقة المثلى لاستيعاب موضوع: "${topic1}"؟`,
      options: [
        'الحفظ الصم دون فهم القواعد والشواهد',
        'الربط بين القواعد النظرية وحل التمارين والأنشطة التطبيقية',
        'تخطي المسائل المحلولة في الدرس',
        'عدم مراجعة المعلم الذكي عند وجود استفسار'
      ],
      correctAnswer: 1,
      explanation: 'تحقيق نواتج التعلم يعتمد على الجمع بين استيعاب القواعد والمفاهيم النظرية وتطبيقها في حل المسائل والأنشطة.',
      topic: topic1,
      difficulty: 'متوسط'
    },
    {
      id: `gen-3-${book.id}`,
      question: `أي مما يلي يُعد من مخرجات التعلم المستهدفة في وحدة: "${ch2}"؟`,
      options: [
        'تنمية مهارات التفكير العلمي والتحليل المنطقي لدى الطالب',
        'حصر المعرفة في إطار نظري دون ممارسة',
        'تقليص فرص البحث والاستكشاف الذاتي',
        'الاكتفاء بالقراءة السريعة دون تدريب'
      ],
      correctAnswer: 0,
      explanation: 'تهدف المناهج المطورة لتعزيز مهارات التحليل والاستنتاج وحل المشكلات لدى الطلاب في البيئة التعليمية.',
      topic: ch2,
      difficulty: 'متوسط'
    },
    {
      id: `gen-4-${book.id}`,
      question: `عند التعامل مع أسئلة التقييم الذاتي واختبارات نافس في مقرر (${subject})، يجب على الطالب:`,
      options: [
        'قراءة رأس السؤال بعناية وتحديد المطلوب بدقة قبل اختيار الإجابة',
        'اختيار أول إجابة تظهر دون قراءة باقي الخيارات',
        'تخمين الإجابة عشوائياً لتوفير الوقت',
        'تخطي الأسئلة التي تتطلب تحليلاً أو خطوات حل'
      ],
      correctAnswer: 0,
      explanation: 'مهارة قراءة السؤال وفهم المطلوب والتحقق من المعطيات هي مفتاح التفوق في الاختبارات المدرسية والوطنية.',
      topic: 'استراتيجيات الحل الذكي',
      difficulty: 'سهل'
    },
    {
      id: `gen-5-${book.id}`,
      question: `ما أهمية الفصول الختامية والتطبيقات المتقدمة في كتاب (${title}) مثل "${ch3}"؟`,
      options: [
        'ربط المفاهيم بواقع الحياة اليومية وتأهيل الطالب للمرحلة التالية',
        'مجرد صفحات إضافية دون أهداف تعليمية',
        'إلغاء ما تم دراسته في الفصول الأولى',
        'عدم إدراجها ضمن قياس المكتسبات'
      ],
      correctAnswer: 0,
      explanation: 'تساعد التطبيقات الختامية في ترسيخ المكتسبات المعرفية ونقل أثر التعلم إلى مواقف ومسائل حياتية واقعية.',
      topic: ch3,
      difficulty: 'متوسط'
    }
  ];
}

export const QuizModal: React.FC<QuizModalProps> = ({
  book,
  isOpen,
  onClose,
  onOpenBookDetail,
  onOpenSmartTeacher,
  studentProfile,
  onUpdateStudentProfile,
  onSaveQuizResult,
  onNavigateToDashboard
}) => {
  const [quizRound, setQuizRound] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [savedQuizResult, setSavedQuizResult] = useState<StudentQuizResult | null>(null);
  const [hasUnlockedChallengeBadge, setHasUnlockedChallengeBadge] = useState<boolean>(false);
  const [isResultSaved, setIsResultSaved] = useState<boolean>(false);

  // Generate 5 questions tailored to this book and round
  const questions = useMemo(() => {
    if (!book) return [];
    return generateCurriculumQuizQuestions(book, quizRound);
  }, [book, quizRound]);

  // Reset quiz state when book changes or round increases
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSelectedAnswers({});
      setIsSubmitted(false);
      setTimerSeconds(0);
      setIsTimerRunning(true);
      setSavedQuizResult(null);
      setHasUnlockedChallengeBadge(false);
      setIsResultSaved(false);
    }
  }, [isOpen, quizRound, book?.id]);

  // Timer tick
  useEffect(() => {
    let interval: any = null;
    if (isOpen && isTimerRunning && !isSubmitted) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, isTimerRunning, isSubmitted]);

  if (!isOpen || !book) return null;

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const cleanBookTitle = book.book_name || book.title;

  // Format timer into mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Option selection
  const handleSelectOption = (optIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optIndex
    }));
  };

  // Calculate score
  const score = useMemo(() => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  }, [questions, selectedAnswers]);

  const percentage = Math.round((score / totalQuestions) * 100);

  // Save quiz result to student profile and grant "تحدي جديد" badge if score >= 80%
  const saveQuizResultToProfile = (finalScore: number, finalPercentage: number) => {
    try {
      const isSuccessOver80 = finalPercentage >= 80;
      const subjectName = (book.subject_name || book.subject || book.title || 'مقرر منهجي').trim();

      const newResult: StudentQuizResult = {
        id: `quiz-res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        bookId: book.id,
        bookTitle: cleanBookTitle,
        subject: subjectName,
        grade: book.grade || '',
        score: finalScore,
        totalQuestions: totalQuestions,
        percentage: finalPercentage,
        passed: isSuccessOver80,
        completedAt: new Date().toISOString(),
        timeSpentSeconds: timerSeconds,
        unlockedNewChallenge: isSuccessOver80
      };

      // 1. Get base student profile from props, localStorage, or fallback
      let baseProfile: StudentProfile = studentProfile
        ? { ...studentProfile }
        : {
            id: 'student-current',
            name: 'طالب مسجل',
            grade: book.grade || 'الصف الثالث المتوسط',
            stage: book.stage || 'middle',
            avatar: '🧑‍🎓',
            schoolSlug: '',
            screenTimeDailyLimitMinutes: 90,
            screenTimeUsedTodayMinutes: 45,
            aiQuestionsCountToday: 8,
            subjectsPerformance: [],
            upcomingExams: []
          };

      try {
        const localSaved = localStorage.getItem('htaf_student_profile');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (parsed && typeof parsed === 'object') {
            baseProfile = { ...baseProfile, ...parsed };
          }
        }
      } catch (e) {
        console.warn('Could not read existing htaf_student_profile from localStorage:', e);
      }

      // 2. Prepend the quiz result to quizResults array
      const existingResults = Array.isArray(baseProfile.quizResults) ? baseProfile.quizResults : [];
      const updatedQuizResults = [newResult, ...existingResults].slice(0, 50);

      // 3. Handle Badges: If percentage >= 80%, unlock 'تحدي جديد' badge!
      const existingBadges = Array.isArray(baseProfile.badges) ? [...baseProfile.badges] : [];
      let updatedBadges = [...existingBadges];
      let challengeBadgeObj: StudentChallengeBadge | null = baseProfile.newChallengeBadge || null;
      let hasChallengeBadge = Boolean(baseProfile.hasNewChallengeBadge);

      if (isSuccessOver80) {
        hasChallengeBadge = true;
        if (!updatedBadges.includes('تحدي جديد')) {
          updatedBadges.push('تحدي جديد');
        }
        challengeBadgeObj = {
          id: `challenge-badge-${Date.now()}`,
          title: 'تحدي جديد',
          description: `اجتياز اختبار مقرر «${cleanBookTitle}» بنسبة تفوق 80% (${finalPercentage}%)`,
          subject: subjectName,
          score: finalScore,
          totalQuestions: totalQuestions,
          percentage: finalPercentage,
          unlockedAt: new Date().toISOString(),
          bookTitle: cleanBookTitle,
          icon: finalScore === 5 ? '🌟' : '🏆'
        };
      }

      // 4. Update or add subjectsPerformance
      let updatedPerformance = Array.isArray(baseProfile.subjectsPerformance)
        ? [...baseProfile.subjectsPerformance]
        : [];

      if (subjectName) {
        const sIdx = updatedPerformance.findIndex(
          (s) => s.subject === subjectName || subjectName.includes(s.subject) || s.subject.includes(subjectName)
        );
        if (sIdx >= 0) {
          const current = updatedPerformance[sIdx];
          const newScore = Math.max(current.scorePercentage, finalPercentage);
          updatedPerformance[sIdx] = {
            ...current,
            scorePercentage: newScore,
            gradeLetter: newScore >= 90 ? 'ممتاز A+' : newScore >= 80 ? 'جيد جداً B+' : 'جيد C',
            masteryLevel: newScore >= 80 ? 'ممتاز' : 'جيد جداً'
          };
        } else {
          updatedPerformance.push({
            subject: subjectName,
            scorePercentage: finalPercentage,
            gradeLetter: finalPercentage >= 90 ? 'ممتاز A+' : finalPercentage >= 80 ? 'جيد جداً B+' : 'جيد C',
            masteryLevel: finalPercentage >= 80 ? 'ممتاز' : 'جيد جداً',
            homeworkCompleted: 4,
            totalHomework: 4
          });
        }
      }

      // 5. Construct final updated profile
      const updatedProfile: StudentProfile = {
        ...baseProfile,
        quizResults: updatedQuizResults,
        badges: updatedBadges,
        hasNewChallengeBadge: hasChallengeBadge,
        newChallengeBadge: challengeBadgeObj,
        subjectsPerformance: updatedPerformance
      };

      // 6. Persist to localStorage
      try {
        localStorage.setItem('htaf_student_profile', JSON.stringify(updatedProfile));
      } catch (e) {
        console.warn('Failed to save updated student profile to localStorage:', e);
      }

      // 7. Dispatch global custom event for other views/dashboards
      try {
        window.dispatchEvent(
          new CustomEvent('htaf_student_profile_updated', {
            detail: updatedProfile
          })
        );
      } catch (e) {
        // ignore
      }

      // 8. Trigger callbacks
      if (onUpdateStudentProfile) {
        onUpdateStudentProfile(updatedProfile);
      }
      if (onSaveQuizResult) {
        onSaveQuizResult(newResult, updatedProfile);
      }

      setSavedQuizResult(newResult);
      setHasUnlockedChallengeBadge(isSuccessOver80);
      setIsResultSaved(true);
    } catch (err) {
      console.warn('Error during quiz profile saving:', err);
    }
  };

  // Submission
  const handleSubmitQuiz = () => {
    setIsSubmitted(true);
    setIsTimerRunning(false);
    saveQuizResultToProfile(score, percentage);
  };

  // Retake quiz with fresh / shuffled questions
  const handleRetakeQuiz = () => {
    setQuizRound((r) => r + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl my-auto overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* ========================================================================= */}
        {/* Header Bar */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black shadow-inner">
              <Target className="w-5 h-5" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-400/30">
                  {book.subject}
                </span>
                <span className="text-slate-400 text-xs font-bold">
                  {book.grade} • ف{book.term || 1}
                </span>
              </div>
              <h3 className="font-black text-sm sm:text-base text-white truncate max-w-xs sm:max-w-md mt-0.5">
                اختبار سريع: {cleanBookTitle}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer Badge */}
            <div className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 text-xs font-mono font-black">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{formatTime(timerSeconds)}</span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              title="إغلاق الاختبار"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Question Stepper & Progress Ribbon (Hidden on final results view) */}
        {/* ========================================================================= */}
        {!isSubmitted && (
          <div className="bg-slate-50 border-b border-slate-200 px-5 sm:px-6 py-3">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>السؤال {currentIndex + 1} من {totalQuestions}</span>
              </span>
              <span className="text-emerald-700">
                {answeredCount} من {totalQuestions} أسئلة مجابة ({Math.round((answeredCount / totalQuestions) * 100)}%)
              </span>
            </div>

            {/* Progress Step Circles */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = selectedAnswers[idx] !== undefined;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      isCurrent
                        ? 'bg-emerald-600 ring-2 ring-emerald-300 ring-offset-1'
                        : isAnswered
                        ? 'bg-emerald-400'
                        : 'bg-slate-200 hover:bg-slate-300'
                    }`}
                    title={`الانتقال إلى السؤال ${idx + 1}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Modal Body */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">

          {/* --------------------------------------------------------------------- */}
          {/* VIEW 1: ACTIVE QUIZ QUESTIONS */}
          {/* --------------------------------------------------------------------- */}
          {!isSubmitted && currentQuestion && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Question Metadata & Cognitive Domain */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-700 text-xs font-black px-2.5 py-1 rounded-lg border border-slate-200">
                    السؤال {currentIndex + 1}
                  </span>
                  {currentQuestion.topic && (
                    <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-emerald-600" />
                      <span>{currentQuestion.topic}</span>
                    </span>
                  )}
                </div>

                {currentQuestion.difficulty && (
                  <span
                    className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      currentQuestion.difficulty === 'سهل'
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : currentQuestion.difficulty === 'متوسط'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    مستوى: {currentQuestion.difficulty}
                  </span>
                )}
              </div>

              {/* Question Text Box */}
              <div className="bg-gradient-to-br from-slate-50 to-emerald-50/20 p-5 rounded-2xl border border-slate-200/80 text-right space-y-2">
                <h4 className="font-black text-base sm:text-lg text-slate-900 leading-relaxed">
                  {currentQuestion.question}
                </h4>
                <p className="text-xs text-slate-500">
                  اختر الإجابة الصحيحة من بين الخيارات الأربعة الآتية:
                </p>
              </div>

              {/* 4 Multiple Choice Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((optionText, optIdx) => {
                  const isSelected = selectedAnswers[currentIndex] === optIdx;
                  const optionLetters = ['أ', 'ب', 'ج', 'د'];

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full text-right p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 group ${
                        isSelected
                          ? 'bg-emerald-50/90 border-emerald-500 shadow-md ring-2 ring-emerald-400/30'
                          : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span
                          className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 transition ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 group-hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {optionLetters[optIdx]}
                        </span>
                        <span
                          className={`text-sm sm:text-base font-bold leading-snug ${
                            isSelected ? 'text-emerald-950 font-black' : 'text-slate-800'
                          }`}
                        >
                          {optionText}
                        </span>
                      </div>

                      <div className="shrink-0">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300 group-hover:border-slate-400'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Help & Hint */}
              <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  <span>يمكنك تغيير إجابتك أو التنقل بين الأسئلة قبل تسليم الاختبار.</span>
                </span>

                {onOpenSmartTeacher && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSmartTeacher(
                        book.subject,
                        book.grade,
                        `شرح مسألة: ${currentQuestion.question}`
                      );
                    }}
                    className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>اسأل المعلم</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* VIEW 2: FINAL QUIZ RESULTS & EXPLANATIONS */}
          {/* --------------------------------------------------------------------- */}
          {isSubmitted && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Score Hero Card */}
              <div
                className={`p-6 sm:p-7 rounded-3xl text-center text-white space-y-3 relative overflow-hidden shadow-xl ${
                  score >= 4
                    ? 'bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900'
                    : score >= 3
                    ? 'bg-gradient-to-br from-sky-700 via-blue-800 to-slate-900'
                    : 'bg-gradient-to-br from-amber-700 via-orange-800 to-slate-900'
                }`}
              >
                <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md mx-auto flex items-center justify-center text-3xl shadow-inner border border-white/20">
                  {score === 5 ? '🌟' : score >= 4 ? '🏆' : score >= 3 ? '👏' : '📚'}
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {score === 5
                      ? 'درجة كاملة! استيعاب استثنائي للمقرر'
                      : score >= 4
                      ? 'رائع جداً! مستوى متقدم ولديك فهم عميق'
                      : score >= 3
                      ? 'أداء جيد! أحسنت وبقي لك خطوات للإتقان التام'
                      : 'محاولة طيبة! راجع الفصول وأعد المحاولة'}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-md mx-auto leading-relaxed">
                    أنهيت اختبار كتاب <strong>"{cleanBookTitle}"</strong> في زمن قياسي قدره {formatTime(timerSeconds)}.
                  </p>
                </div>

                {/* Score Stats Badge */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  <div className="bg-white/15 px-4 py-2 rounded-2xl border border-white/20 backdrop-blur-sm">
                    <span className="text-2xl sm:text-3xl font-black text-white">{score}</span>
                    <span className="text-xs text-white/70 font-bold mr-1">/ {totalQuestions}</span>
                    <p className="text-[10px] text-white/70 uppercase tracking-wider font-extrabold">الدرجة النهائية</p>
                  </div>

                  <div className="bg-white/15 px-4 py-2 rounded-2xl border border-white/20 backdrop-blur-sm">
                    <span className="text-2xl sm:text-3xl font-black text-white">{percentage}%</span>
                    <p className="text-[10px] text-white/70 uppercase tracking-wider font-extrabold">نسبة الإتقان</p>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* NEW CHALLENGE BADGE UNLOCK CELEBRATION (نسبة نجاح تفوق 80%) */}
              {/* ----------------------------------------------------------------- */}
              {percentage >= 80 ? (
                <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/25 to-orange-500/15 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 text-right shadow-lg relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                  <div className="absolute -top-12 -left-12 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl font-black shadow-lg shadow-amber-500/30 shrink-0 ring-4 ring-amber-300/50 animate-bounce">
                        🏆
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[11px] font-black px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-slate-950" />
                            <span>إنجاز مستحق: نسبة تفوق 80%</span>
                          </span>
                          <span className="text-amber-800 font-black text-xs">
                            نسبة نجاحك ({percentage}%)
                          </span>
                        </div>
                        <h4 className="text-base sm:text-lg font-black text-slate-900">
                          تم منحك شارة «تحدي جديد» وإضافتها إلى لوحة التحكم!
                        </h4>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          تم حفظ وتوثيق درجاتك في ملف الطالب (<span className="font-mono text-emerald-800 font-bold">StudentProfile</span>)، وستشاهد شارة التحدي الجديدة بارزة في بطاقتك الشخصية داخل لوحة التحكم.
                        </p>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto shrink-0 flex sm:flex-col items-center justify-end gap-2">
                      <div className="bg-white border-2 border-amber-300 text-amber-950 px-4 py-2 rounded-2xl text-center shadow-sm w-full sm:w-auto">
                        <span className="text-xs font-black block flex items-center justify-center gap-1">
                          <Award className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span>شارة تحدي جديد</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 font-black flex items-center justify-center gap-1 mt-0.5">
                          <Check className="w-3 h-3" />
                          <span>تم التفعيل في لوحة التحكم</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-right flex items-center justify-between gap-3 text-xs text-emerald-900">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold">تم حفظ نتيجة الاختبار في ملفك الدراسي (StudentProfile).</span>
                      <p className="text-emerald-700 text-[11px] mt-0.5">
                        أحرز نسبة 80% فما فوق (4 إجابات صحيحة على الأقل) لفتح شارة «تحدي جديد» الذهبية في لوحة التحكم!
                      </p>
                    </div>
                  </div>
                  <span className="bg-white border border-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-lg shrink-0">
                    تم الحفظ بنجاح
                  </span>
                </div>
              )}

              {/* Detailed Question Review List */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>مراجعة إجاباتك والشروحات التعليمية المفصلة:</span>
                  </span>
                  <span className="text-xs text-slate-500">
                    {score} إجابات صحيحة • {totalQuestions - score} أخطاء
                  </span>
                </h4>

                <div className="space-y-3.5">
                  {questions.map((q, qIdx) => {
                    const studentChoice = selectedAnswers[qIdx];
                    const isCorrect = studentChoice === q.correctAnswer;
                    const optionLetters = ['أ', 'ب', 'ج', 'د'];

                    return (
                      <div
                        key={q.id}
                        className={`p-4 sm:p-5 rounded-2xl border text-right space-y-3 transition ${
                          isCorrect
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-rose-50/40 border-rose-200'
                        }`}
                      >
                        {/* Question Title Bar */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-rose-600 text-white'
                              }`}
                            >
                              {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            </div>
                            <div>
                              <span className="text-[11px] font-extrabold text-slate-500">
                                السؤال {qIdx + 1} {q.topic && `• ${q.topic}`}
                              </span>
                              <h5 className="font-bold text-sm text-slate-900 mt-0.5">
                                {q.question}
                              </h5>
                            </div>
                          </div>

                          <span
                            className={`text-xs font-black px-2.5 py-0.5 rounded-full shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}
                          </span>
                        </div>

                        {/* Answers Comparison */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {/* Student Answer */}
                          <div
                            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                              isCorrect
                                ? 'bg-emerald-100/60 text-emerald-900 border-emerald-300 font-bold'
                                : 'bg-rose-100/60 text-rose-900 border-rose-300 font-bold'
                            }`}
                          >
                            <span className="font-black">إجابتك:</span>
                            <span>
                              {studentChoice !== undefined
                                ? `${optionLetters[studentChoice]} - ${q.options[studentChoice]}`
                                : 'لم تتم الإجابة'}
                            </span>
                          </div>

                          {/* Correct Answer */}
                          {!isCorrect && (
                            <div className="p-2.5 rounded-xl border bg-emerald-100/80 text-emerald-950 border-emerald-400 font-bold flex items-center gap-2">
                              <span className="font-black">الإجابة الصحيحة:</span>
                              <span>
                                {optionLetters[q.correctAnswer]} - {q.options[q.correctAnswer]}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Pedagogical Explanation Box */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-900 font-black">الشرح والتوضيح: </strong>
                            <span>{q.explanation}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* Modal Footer Controls */}
        {/* ========================================================================= */}
        <div className="bg-slate-50 px-5 sm:px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* DURING QUIZ BUTTONS */}
          {!isSubmitted && (
            <>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
                  disabled={currentIndex === 0}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition flex items-center justify-center gap-1.5"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>

                {currentIndex < totalQuestions - 1 ? (
                  <button
                    onClick={() => setCurrentIndex((idx) => Math.min(totalQuestions - 1, idx + 1))}
                    className="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    className="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>إنهاء الاختبار وعرض النتيجة</span>
                  </button>
                )}
              </div>

              {/* Submit Quiz anytime if at least one answered */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {answeredCount > 0 && currentIndex < totalQuestions - 1 && (
                  <button
                    onClick={handleSubmitQuiz}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline px-2 py-1"
                  >
                    تسليم الاختبار الآن ({answeredCount}/{totalQuestions})
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-200 transition"
                >
                  إلغاء
                </button>
              </div>
            </>
          )}

          {/* POST-SUBMISSION RESULTS ACTIONS */}
          {isSubmitted && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleRetakeQuiz}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>إعادة الاختبار بأسئلة أخرى</span>
                </button>

                {onOpenBookDetail && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenBookDetail(book);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>تصفح فهرس الوحدات والدروس</span>
                  </button>
                )}

                {percentage >= 80 && onNavigateToDashboard && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToDashboard();
                    }}
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition border border-amber-300"
                  >
                    <Award className="w-4 h-4 text-slate-950 fill-current" />
                    <span>مشاهدة الشارة في لوحة التحكم</span>
                  </button>
                )}
              </div>

              <button
                onClick={onClose}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs px-5 py-2.5 rounded-xl transition"
              >
                إغلاق
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
