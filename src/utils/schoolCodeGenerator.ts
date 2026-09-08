// Automatic Unique Invitation Code, Reference Number Generator and Duplicate Detection Utility

export type SchoolGenderType = 'boys' | 'girls' | 'mixed';
export type SchoolEducationType = 'حكومي' | 'أهلي' | 'عالمي' | 'تحفيظ قرآن' | 'تربية خاصة' | 'أخرى';
export type SchoolStageType = 'ابتدائي' | 'متوسط' | 'ثانوي' | 'مجمع تعليمي' | 'روضة';

/**
 * Formats standard school display name clearly showing gender
 * e.g., "ثانوية الملك عبدالله – بنين" or "الثانوية الأولى للبنات – بنات"
 */
export function formatSchoolDisplayName(
  rawName: string,
  gender: SchoolGenderType | string = 'boys'
): string {
  if (!rawName) return '';
  const trimmed = rawName.trim();

  // If gender tag already nicely included
  if (
    trimmed.includes('– بنين') ||
    trimmed.includes('- بنين') ||
    trimmed.includes('– بنات') ||
    trimmed.includes('- بنات') ||
    trimmed.includes('– مشتركة') ||
    trimmed.includes('- مشتركة')
  ) {
    return trimmed;
  }

  const genderNormalized = gender.toLowerCase();
  if (genderNormalized === 'girls' || genderNormalized === 'بنات') {
    // If the name already contains "للبنات" but not the suffix, check if needed
    if (trimmed.endsWith('بنات') || trimmed.endsWith('للبنات')) {
      return trimmed;
    }
    return `${trimmed} – بنات`;
  } else if (genderNormalized === 'boys' || genderNormalized === 'بنين') {
    if (trimmed.endsWith('بنين') || trimmed.endsWith('للبنين')) {
      return trimmed;
    }
    return `${trimmed} – بنين`;
  } else if (genderNormalized === 'mixed' || genderNormalized === 'مشتركة') {
    return `${trimmed} – مشتركة`;
  }

  return trimmed;
}

/**
 * Generates an automatic unique secure short invitation code
 * e.g., "SCH-K7P4X9" or with year "SCH-2026-X8P2"
 */
export function generateUniqueInvitationCode(existingCodes: string[] = []): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // base32 without ambiguous 0/O, 1/I
  let attempts = 0;
  let code = '';

  while (attempts < 100) {
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = `SCH-${randomPart}`;
    if (!existingCodes.includes(code)) {
      return code;
    }
    attempts++;
  }

  // Fallback with timestamp
  const tsSuffix = Date.now().toString(36).toUpperCase().slice(-5);
  return `SCH-${tsSuffix}`;
}

/**
 * Generates a sequential reference number
 * e.g., "INV-2026-000041"
 */
export function generateUniqueReferenceNumber(
  existingRefNumbers: string[] = [],
  startSeq: number = 41
): string {
  const currentYear = new Date().getFullYear();
  let maxSeq = startSeq - 1;

  for (const ref of existingRefNumbers) {
    if (ref && ref.startsWith(`INV-${currentYear}-`)) {
      const parts = ref.split('-');
      const numPart = parseInt(parts[2], 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const paddedSeq = nextSeq.toString().padStart(6, '0');
  return `INV-${currentYear}-${paddedSeq}`;
}

/**
 * Builds canonical join link
 * e.g., "https://htaf.online/join?code=SCH-K7P4X9"
 */
export function buildJoinSchoolUrl(invitationCode: string): string {
  const code = (invitationCode || '').trim().toUpperCase();
  return `https://htaf.online/join?code=${encodeURIComponent(code)}`;
}

/**
 * Duplicate School Detection Check
 */
export interface DuplicateCheckCandidate {
  name: string;
  moeCode?: string;
  region?: string;
  governorate?: string;
  city?: string;
  lat?: number;
  lng?: number;
}

export function checkSchoolDuplicates(
  candidate: DuplicateCheckCandidate,
  existingSchools: any[]
): { isDuplicate: boolean; matchReason?: string; matchingSchool?: any } {
  if (!candidate.name) return { isDuplicate: false };

  const cleanCandName = candidate.name
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .toLowerCase();

  const candMoe = (candidate.moeCode || '').trim();

  for (const school of existingSchools) {
    const existingMoe = (school.moeCode || school.license_number || school.licenseNumber || '').trim();
    if (candMoe && existingMoe && candMoe === existingMoe) {
      return {
        isDuplicate: true,
        matchReason: `الرقم الوزاري/الترخيص (${candMoe}) مسجل مسبقاً لمدرسة: ${school.name}`,
        matchingSchool: school
      };
    }

    const cleanExistingName = (school.name || '')
      .trim()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .toLowerCase();

    // Exact name match
    if (cleanCandName === cleanExistingName) {
      return {
        isDuplicate: true,
        matchReason: `اسم المدرسة "${school.name}" مسجل مسبقاً بنفس الاسم في المنصة`,
        matchingSchool: school
      };
    }

    // Similarity match within same city
    const sameCity =
      candidate.city &&
      school.city &&
      (candidate.city === school.city || school.location?.includes(candidate.city));

    if (sameCity && (cleanCandName.includes(cleanExistingName) || cleanExistingName.includes(cleanCandName))) {
      return {
        isDuplicate: true,
        matchReason: `توجد مدرسة مطابقة في نفس المدينة (${candidate.city}): "${school.name}"`,
        matchingSchool: school
      };
    }

    // Distance proximity check (< 100 meters)
    if (
      candidate.lat &&
      candidate.lng &&
      school.latitude &&
      school.longitude
    ) {
      const distanceMeters = getDistanceFromLatLonInMeters(
        candidate.lat,
        candidate.lng,
        school.latitude,
        school.longitude
      );
      if (distanceMeters < 100) {
        return {
          isDuplicate: true,
          matchReason: `الموقع الجغرافي المحدد مطابق جداً لموقع مدرسة مسجلة مسبقاً: "${school.name}" (على بعد ${Math.round(distanceMeters)} متر)`,
          matchingSchool: school
        };
      }
    }
  }

  return { isDuplicate: false };
}

function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
