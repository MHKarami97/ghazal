import type { GanjoorPerson, GanjoorPersonRelation } from '../types/ganjoor';

export type NormalizedGender = 'male' | 'female' | 'unknown';

var MALE_GENDER_TOKENS = ['male', 'm', 'man', 'مرد', 'مذکر'];
var FEMALE_GENDER_TOKENS = ['female', 'f', 'woman', 'زن', 'مونث', 'مؤنث'];

/**
 * یکدست‌سازی مقدار Gender در GanjoorPerson برای پشتیبانی از مقادیر متنی متفاوت و حالت نامشخص
 */
export function normalizePersonGender(gender?: string | null): NormalizedGender {
  if (!gender) return 'unknown';
  var token = String(gender).trim().toLowerCase();
  if (!token) return 'unknown';
  if (MALE_GENDER_TOKENS.indexOf(token) !== -1) return 'male';
  if (FEMALE_GENDER_TOKENS.indexOf(token) !== -1) return 'female';
  return 'unknown';
}

/**
 * برچسب رابطه بین دو نفر در کارت تبارشناسی («Person1 [برچسب] Person2»).
 * چون پیوندها به صورت جهت‌دار از Person1Id به Person2Id نمایش داده می‌شوند،
 * با خواندن Gender شخص اول، عنوان دقیق «پدرِ / مادرِ» یا «برادرِ / خواهرِ» تعیین می‌شود.
 */
export function formatPairRelationLabel(
  relationType: string,
  person1?: GanjoorPerson | null
): string {
  var g1 = normalizePersonGender(person1?.Gender);

  switch (relationType) {
    case 'Parent':
      if (g1 === 'male') return 'پدرِ';
      if (g1 === 'female') return 'مادرِ';
      return 'پدر / مادرِ';
    case 'Sibling':
      if (g1 === 'male') return 'برادرِ';
      if (g1 === 'female') return 'خواهرِ';
      return 'برادر / خواهرِ';
    case 'Spouse':
      return 'همسرِ';
    case 'Ancestor':
      return 'نیا و تبارِ';
    default:
      return relationType;
  }
}

/**
 * عنوان دقیق نسبت طرف مقابل در صفحه جزئیات یک فرد.
 * بر اساس اینکه فردِ در حال مشاهده در جایگاه Person1Id است یا Person2Id
 * و با در نظر گرفتن Gender طرف مقابل، نقش واقعی (پدر/مادر در برابر پسر/دختر/فرزند و نیا در برابر نواده) برگردانده می‌شود.
 */
export function formatRelatedPersonRole(
  rel: GanjoorPersonRelation,
  currentPersonId: number,
  otherPerson?: GanjoorPerson | null
): string {
  var isCurrentPerson1 = rel.Person1Id === currentPersonId;
  var otherGender = normalizePersonGender(otherPerson?.Gender);

  switch (rel.RelationType) {
    case 'Parent':
      if (!isCurrentPerson1) {
        if (otherGender === 'male') return 'پدر';
        if (otherGender === 'female') return 'مادر';
        return 'والد';
      }
      if (otherGender === 'male') return 'پسر';
      if (otherGender === 'female') return 'دختر';
      return 'فرزند';

    case 'Ancestor':
      return !isCurrentPerson1 ? 'نیا / جد' : 'نواده / نسل';

    case 'Sibling':
      if (otherGender === 'male') return 'برادر';
      if (otherGender === 'female') return 'خواهر';
      return 'برادر / خواهر';

    case 'Spouse':
      return 'همسر';

    default:
      return rel.RelationType;
  }
}
