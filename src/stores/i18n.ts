/**
 * Bilingual support: Arabic (default) and English.
 *
 * A plain reactive module, matching the approach used by the auth store — the
 * app has no i18n library and one lookup table earns its weight better than a
 * dependency here.
 *
 * Direction is part of the locale: Arabic is RTL, English LTR. Switching
 * rewrites <html lang> and <html dir> so the CSS logical properties the layout
 * already uses (inset-inline, border-inline) flip on their own.
 *
 * Not translated, by design:
 *   - Criterion labels. The API stores a single `labelAr` and exposes no
 *     English counterpart, so they render in Arabic in both locales.
 *   - Server `message` text. Those strings arrive from the backend in Arabic
 *     and are shown verbatim rather than guessed at.
 */
import { computed, ref } from 'vue'

export type Locale = 'ar' | 'en'

const STORAGE_KEY = 'partnersurvey.locale'

/** Every user-facing string, keyed identically across locales. */
const MESSAGES = {
  ar: {
    'app.brand': 'فايبر اكس',
    'app.switchTo': 'English',

    'nav.dashboard': 'لوحة التحكم',
    'nav.surveys': 'الاستبيانات',
    'nav.criteria': 'معايير التقييم',
    'nav.users': 'المستخدمون',
    'nav.profile': 'الملف الشخصي',
    'nav.changePassword': 'تغيير كلمة المرور',
    'nav.logout': 'تسجيل الخروج',
    'nav.menu': 'القائمة',

    'common.back': 'رجوع',
    'common.refresh': 'تحديث',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.details': 'التفاصيل',
    'common.edit': 'تعديل',
    'common.retry': 'إعادة المحاولة',
    'common.loading': 'جارٍ التحميل…',
    'common.saving': 'جارٍ الحفظ…',
    'common.yes': 'نعم',
    'common.no': 'لا',
    'common.id': 'المعرف',
    'common.serverData': 'البيانات كما يعيدها الخادم',
    'common.unexpected': 'حدث خطأ غير متوقع',
    'common.viewAll': 'عرض الكل',
    'common.actions': 'الإجراءات',
    'common.notFound': 'غير موجود',
    'common.close': 'إغلاق',

    'role.admin': 'مدير',
    'role.user': 'مستخدم',

    'status.active': 'مفعّل',
    'status.inactive': 'غير مفعّل',

    'login.title': 'تسجيل الدخول',
    'login.subtitle': 'لوحة تحكم استبيان الشركاء التجاريين',
    'login.userName': 'اسم المستخدم',
    'login.password': 'كلمة المرور',
    'login.submit': 'دخول',
    'login.submitting': 'جارٍ الدخول…',
    'login.userNameRequired': 'يرجى إدخال اسم المستخدم',
    'login.passwordRequired': 'يرجى إدخال كلمة المرور',
    'login.showPassword': 'إظهار كلمة المرور',
    'login.hidePassword': 'إخفاء كلمة المرور',
    'login.toSurvey': 'الذهاب إلى استبيان التقييم',

    'dashboard.greeting': 'مرحباً، {name}',
    'dashboard.subtitle': 'نظرة عامة على بيانات استبيان الشركاء',
    'dashboard.loadFailed': 'تعذر تحميل البيانات',
    'dashboard.recent': 'أحدث الاستبيانات',

    'surveys.title': 'الاستبيانات',
    'surveys.subtitle': 'استبيانات الشركاء التجاريين، الأحدث أولاً',
    'surveys.new': 'استبيان جديد',
    'surveys.edit': 'تعديل الاستبيان',
    'surveys.search': 'بحث باسم الشركة أو رقم التواصل…',
    'surveys.company': 'اسم الشركة',
    'surveys.companyFull': 'اسم الشركة / الجهة',
    'surveys.phone': 'رقم التواصل',
    'surveys.feedback': 'الملاحظات',
    'surveys.average': 'المعدل',
    'surveys.detailsTitle': 'تفاصيل الاستبيان',
    'surveys.loadFailed': 'تعذر تحميل الاستبيانات',
    'surveys.loadOneFailed': 'تعذر تحميل الاستبيان',
    'surveys.empty': 'لا توجد استبيانات',
    'surveys.emptyHint': 'لم يتم استلام أي استبيان حتى الآن.',
    'surveys.noResults': 'لا توجد نتائج',
    'surveys.noResultsHint': 'لم يُعثر على استبيان مطابق لبحثك.',
    'surveys.created': 'تم إنشاء الاستبيان',
    'surveys.updated': 'تم تحديث الاستبيان',
    'surveys.patchHint': 'يتم إرسال الحقول المعدّلة فقط.',

    'ratings.title': 'التقييمات',
    'ratings.criterion': 'المعيار',
    'ratings.score': 'الدرجة',
    'ratings.empty': 'لا توجد تقييمات',
    'ratings.emptyHint': 'لم يتم تسجيل أي درجة لهذا الاستبيان.',
    'ratings.loadFailed': 'تعذر تحميل التقييمات',
    'ratings.loading': 'جارٍ تحميل التقييمات…',
    'ratings.truncated': 'عدد التقييمات كبير، وقد لا تكون القائمة مكتملة.',
    'ratings.deletedCriterion': 'معيار محذوف',

    'criteria.title': 'معايير التقييم',
    'criteria.detailsTitle': 'تفاصيل المعيار',
    'criteria.new': 'معيار جديد',
    'criteria.label': 'العنوان',
    'criteria.scaleMin': 'أدنى قيمة',
    'criteria.scaleMax': 'أعلى قيمة',
    'criteria.order': 'الترتيب',
    'criteria.required': 'إلزامي',
    'criteria.status': 'الحالة',
    'criteria.createdAt': 'تاريخ الإنشاء',
    'criteria.empty': 'لا توجد معايير',
    'criteria.loadFailed': 'تعذر تحميل المعايير',
    'criteria.loadOneFailed': 'تعذر تحميل المعيار',

    'users.title': 'المستخدمون',
    'users.detailsTitle': 'تفاصيل المستخدم',
    'users.search': 'بحث باسم المستخدم…',
    'users.userName': 'اسم المستخدم',
    'users.role': 'الدور',
    'users.status': 'الحالة',
    'users.createdAt': 'تاريخ الإنشاء',
    'users.lastLogin': 'آخر تسجيل دخول',
    'users.activate': 'تفعيل',
    'users.empty': 'لا يوجد مستخدمون',
    'users.loadFailed': 'تعذر تحميل المستخدمين',
    'users.loadOneFailed': 'تعذر تحميل المستخدم',
    'users.statusUpdated': 'تم تحديث حالة المستخدم',
    'users.subtitle2': 'حسابات لوحة التحكم، الأحدث أولاً',
    'users.lastLoginShort': 'آخر دخول',
    'users.you': '(أنت)',
    'users.noResultsHint': 'لم يُعثر على مستخدم مطابق لبحثك.',
    'users.activateTitle': 'تفعيل المستخدم',
    'users.deactivateTitle': 'إلغاء تفعيل المستخدم',
    'users.deactivateLabel': 'إلغاء التفعيل',
    'users.confirmActivate': 'سيتم تفعيل المستخدم «{name}»، وسيتمكن من تسجيل الدخول مرة أخرى.',
    'users.confirmDeactivate':
      'سيتم إلغاء تفعيل المستخدم «{name}»، ولن يتمكن من تسجيل الدخول بعد ذلك.',

    'criteria.subtitle2': 'مرتّبة تنازلياً حسب حقل الترتيب، كما يعيدها الخادم',
    'criteria.search2': 'بحث في عنوان المعيار…',
    'criteria.noResultsHint': 'لم يُعثر على معيار مطابق لبحثك.',
    'criteria.emptyHint2': 'لم يتم إنشاء أي معيار بعد.',
    'criteria.newTitle': 'معيار تقييم جديد',
    'criteria.labelField': 'عنوان المعيار',
    'criteria.created2': 'تم إنشاء المعيار',

    'profile.title': 'الملف الشخصي',
    'profile.subtitle': 'بيانات الحساب الحالي',
    'profile.loadFailed': 'تعذر تحميل الملف الشخصي',

    'password.title': 'تغيير كلمة المرور',
    'password.current': 'كلمة المرور الحالية',
    'password.new': 'كلمة المرور الجديدة',
    'password.confirm': 'تأكيد كلمة المرور الجديدة',
    'password.currentRequired': 'يرجى إدخال كلمة المرور الحالية',
    'password.newRequired': 'يرجى إدخال كلمة المرور الجديدة',
    'password.confirmRequired': 'يرجى تأكيد كلمة المرور الجديدة',
    'password.tooShort': 'يجب أن لا تقل كلمة المرور عن {min} أحرف',
    'password.tooLong': 'يجب أن لا تزيد كلمة المرور عن {max} حرف',
    'password.mismatch': 'كلمتا المرور غير متطابقتين',
    'password.subtitle2': 'كلمة المرور الجديدة من {min} إلى {max} حرفاً',
    'password.confirmHint': 'هذا الحقل للتحقق فقط ولا يُرسل إلى الخادم.',
    'password.saved': 'تم تغيير كلمة المرور بنجاح',
    'password.save': 'حفظ كلمة المرور',
    'password.show': 'إظهار',
    'password.hide': 'إخفاء',

    'pager.records': 'سجل',
    'pager.page': 'صفحة {page} من {total}',
    'pager.previous': 'السابق',
    'pager.next': 'التالي',
    'pager.perPage': 'لكل صفحة',
    'search.placeholder': 'بحث…',
    'search.clear': 'مسح البحث',
    'confirm.confirm': 'تأكيد',
    'confirm.working': 'جارٍ التنفيذ…',
    'confirm.typeWord': 'اكتب «{word}» للتأكيد:',
    'confirm.deleteWord': 'حذف',

    'common.delete': 'حذف',
    'common.deletePermanently': 'حذف نهائي',
    'surveys.deleteTitle': 'حذف الاستبيان نهائياً',
    'surveys.confirmDelete':
      'سيتم حذف استبيان «{name}» مع جميع تقييماته نهائياً، ولا يمكن التراجع عن ذلك.',
    'surveys.deleted': 'تم حذف الاستبيان نهائياً',
    'surveys.deleteAll': 'حذف جميع الاستبيانات',
    'surveys.deleteAllTitle': 'حذف جميع الاستبيانات نهائياً',
    'surveys.confirmDeleteAll':
      'سيتم حذف كل الاستبيانات وتقييماتها ولا يمكن استرجاعها. معايير التقييم والمستخدمون لن يُحذفوا.',
    'surveys.deletedAll': 'تم حذف {surveys} استبيان و {ratings} تقييم',
    'ratings.deleteTitle': 'حذف التقييم نهائياً',
    'ratings.confirmDelete': 'سيتم حذف تقييم «{name}» من هذا الاستبيان نهائياً.',
    'ratings.deleted': 'تم حذف التقييم',
    'criteria.deleteTitle': 'حذف المعيار نهائياً',
    'criteria.confirmDelete':
      'سيتم حذف المعيار «{name}» نهائياً. لا يمكن حذف معيار مرتبط بتقييمات.',
    'criteria.deleted': 'تم حذف معيار التقييم نهائياً',
    'users.deleteTitle': 'حذف المستخدم نهائياً',
    'users.confirmDelete':
      'سيتم حذف المستخدم «{name}» نهائياً. لإيقافه مؤقتاً استخدم إلغاء التفعيل بدلاً من ذلك.',
    'users.deleted': 'تم حذف المستخدم نهائياً',

    'survey.title': 'استبيان تقييم الخدمة',
    'survey.headerTitle': 'استبيان تقييم خدمة فايبر اكس',
    'survey.headerTitle2': 'للشركاء التجاريين',
    'survey.step': 'الخطوة {step} من {total}',
    'survey.contactHeading': 'بيانات التواصل',
    'survey.companyLabel': 'اسم الشركة / الجهة',
    'survey.phoneLabel': 'رقم التواصل',
    'survey.phoneInvalid': 'يرجى إدخال رقم صحيح يبدأ بـ 07 ويتكون من 11 رقم',
    'survey.companyMissing': 'يرجى إدخال اسم الشركة أو الجهة',
    'survey.notesTitle': 'ملاحظاتكم تساعدنا في تطوير خدماتنا بأستمرار',
    'survey.notesLabel': 'ملاحظات واقتراحات',
    'survey.notesDisclaimer':
      'ملاحظة: قد نستخدم بعض الملاحظات ضمن محتوانا على وسائل التواصل الاجتماعي',
    'survey.ratingsHeading': 'تقييم الخدمة',
    'survey.ratingsSub': 'يرجى تقييم كل بند من البنود التالية',
    'survey.optional': '(اختياري)',
    'survey.best': '{value} : ممتاز',
    'survey.worst': '{value} : غير مُرضي',
    'survey.pickRating': 'يرجى اختيار تقييم',
    'survey.notesPlaceholder': 'شاركونا رأيكم أو تجربتكم مع الخدمة',
    'survey.next': 'التالي',
    'survey.submit': 'إرسال التقييم',
    'survey.resubmit': 'إعادة الإرسال',
    'survey.sending': 'جارٍ الإرسال…',
    'survey.loading': 'جارٍ تحميل الاستبيان…',
    'survey.loadFailed': 'تعذر تحميل الاستبيان',
    'survey.partialSaved': 'تم حفظ بياناتك، اضغط إعادة الإرسال لإكمال التقييم.',
    'survey.successTitle': 'تم استلام تقييمكم بنجاح',
    'survey.successTitle2': 'وسيصل مباشرة إلى فريقنا المختص',
    'survey.successSub': 'نشكركم على وقتكم وثقتكم بفايبر اكس',
    'survey.returning': 'العودة إلى الصفحة الرئيسية خلال {seconds} ثوانٍ…',

    'notFound.title': 'الصفحة غير موجودة',
    'notFound.message': 'تعذر العثور على الصفحة المطلوبة.',
    'notFound.toDashboard': 'العودة إلى لوحة التحكم',
    'notFound.toLogin': 'الذهاب إلى تسجيل الدخول',

    'error.network': 'تعذر الاتصال بالخادم، تحقق من الاتصال بالإنترنت',
    'error.400': 'الطلب غير صالح',
    'error.401': 'انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى',
    'error.403': 'ليس لديك صلاحية للوصول إلى هذه البيانات',
    'error.404': 'العنصر غير موجود',
    'error.409': 'تعارض في البيانات',
    'error.500': 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً',
    'error.generic': 'حدث خطأ',
  },

  en: {
    'app.brand': 'FiberX',
    'app.switchTo': 'العربية',

    'nav.dashboard': 'Dashboard',
    'nav.surveys': 'Surveys',
    'nav.criteria': 'Rating Criteria',
    'nav.users': 'Users',
    'nav.profile': 'Profile',
    'nav.changePassword': 'Change Password',
    'nav.logout': 'Sign out',
    'nav.menu': 'Menu',

    'common.back': 'Back',
    'common.refresh': 'Refresh',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.details': 'Details',
    'common.edit': 'Edit',
    'common.retry': 'Try again',
    'common.loading': 'Loading…',
    'common.saving': 'Saving…',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.id': 'ID',
    'common.serverData': 'Data as returned by the server',
    'common.unexpected': 'An unexpected error occurred',
    'common.viewAll': 'View all',
    'common.actions': 'Actions',
    'common.notFound': 'Not found',
    'common.close': 'Close',

    'role.admin': 'Admin',
    'role.user': 'User',

    'status.active': 'Active',
    'status.inactive': 'Inactive',

    'login.title': 'Sign in',
    'login.subtitle': 'Partner Survey dashboard',
    'login.userName': 'Username',
    'login.password': 'Password',
    'login.submit': 'Sign in',
    'login.submitting': 'Signing in…',
    'login.userNameRequired': 'Please enter your username',
    'login.passwordRequired': 'Please enter your password',
    'login.showPassword': 'Show password',
    'login.hidePassword': 'Hide password',
    'login.toSurvey': 'Go to the evaluation survey',

    'dashboard.greeting': 'Welcome, {name}',
    'dashboard.subtitle': 'An overview of partner survey data',
    'dashboard.loadFailed': 'Could not load the data',
    'dashboard.recent': 'Latest surveys',

    'surveys.title': 'Surveys',
    'surveys.subtitle': 'Business partner surveys, newest first',
    'surveys.new': 'New survey',
    'surveys.edit': 'Edit survey',
    'surveys.search': 'Search by company name or phone…',
    'surveys.company': 'Company',
    'surveys.companyFull': 'Company / organisation',
    'surveys.phone': 'Phone',
    'surveys.feedback': 'Notes',
    'surveys.average': 'Average',
    'surveys.detailsTitle': 'Survey details',
    'surveys.loadFailed': 'Could not load the surveys',
    'surveys.loadOneFailed': 'Could not load the survey',
    'surveys.empty': 'No surveys',
    'surveys.emptyHint': 'No survey has been received yet.',
    'surveys.noResults': 'No results',
    'surveys.noResultsHint': 'No survey matched your search.',
    'surveys.created': 'Survey created',
    'surveys.updated': 'Survey updated',
    'surveys.patchHint': 'Only the changed fields are sent.',

    'ratings.title': 'Ratings',
    'ratings.criterion': 'Criterion',
    'ratings.score': 'Score',
    'ratings.empty': 'No ratings',
    'ratings.emptyHint': 'No score has been recorded for this survey.',
    'ratings.loadFailed': 'Could not load the ratings',
    'ratings.loading': 'Loading ratings…',
    'ratings.truncated': 'There are many ratings; this list may be incomplete.',
    'ratings.deletedCriterion': 'Deleted criterion',

    'criteria.title': 'Rating Criteria',
    'criteria.detailsTitle': 'Criterion details',
    'criteria.new': 'New criterion',
    'criteria.label': 'Label',
    'criteria.scaleMin': 'Minimum',
    'criteria.scaleMax': 'Maximum',
    'criteria.order': 'Order',
    'criteria.required': 'Required',
    'criteria.status': 'Status',
    'criteria.createdAt': 'Created',
    'criteria.empty': 'No criteria',
    'criteria.loadFailed': 'Could not load the criteria',
    'criteria.loadOneFailed': 'Could not load the criterion',

    'users.title': 'Users',
    'users.detailsTitle': 'User details',
    'users.search': 'Search by username…',
    'users.userName': 'Username',
    'users.role': 'Role',
    'users.status': 'Status',
    'users.createdAt': 'Created',
    'users.lastLogin': 'Last sign-in',
    'users.activate': 'Activate',
    'users.empty': 'No users',
    'users.loadFailed': 'Could not load the users',
    'users.loadOneFailed': 'Could not load the user',
    'users.statusUpdated': 'User status updated',
    'users.subtitle2': 'Dashboard accounts, newest first',
    'users.lastLoginShort': 'Last sign-in',
    'users.you': '(you)',
    'users.noResultsHint': 'No user matched your search.',
    'users.activateTitle': 'Activate user',
    'users.deactivateTitle': 'Deactivate user',
    'users.deactivateLabel': 'Deactivate',
    'users.confirmActivate': '“{name}” will be activated and able to sign in again.',
    'users.confirmDeactivate': '“{name}” will be deactivated and will no longer be able to sign in.',

    'criteria.subtitle2': 'Sorted by the order field, descending, as the server returns them',
    'criteria.search2': 'Search criterion labels…',
    'criteria.noResultsHint': 'No criterion matched your search.',
    'criteria.emptyHint2': 'No criterion has been created yet.',
    'criteria.newTitle': 'New rating criterion',
    'criteria.labelField': 'Criterion label',
    'criteria.created2': 'Criterion created',

    'profile.title': 'Profile',
    'profile.subtitle': 'Details of the current account',
    'profile.loadFailed': 'Could not load the profile',

    'password.title': 'Change Password',
    'password.current': 'Current password',
    'password.new': 'New password',
    'password.confirm': 'Confirm new password',
    'password.currentRequired': 'Please enter your current password',
    'password.newRequired': 'Please enter the new password',
    'password.confirmRequired': 'Please confirm the new password',
    'password.tooShort': 'Password must be at least {min} characters',
    'password.tooLong': 'Password must be at most {max} characters',
    'password.mismatch': 'The two passwords do not match',
    'password.subtitle2': 'The new password must be {min} to {max} characters',
    'password.confirmHint': 'This field is for confirmation only and is not sent to the server.',
    'password.saved': 'Password changed successfully',
    'password.save': 'Save password',
    'password.show': 'Show',
    'password.hide': 'Hide',

    'pager.records': 'records',
    'pager.page': 'Page {page} of {total}',
    'pager.previous': 'Previous',
    'pager.next': 'Next',
    'pager.perPage': 'per page',
    'search.placeholder': 'Search…',
    'search.clear': 'Clear search',
    'confirm.confirm': 'Confirm',
    'confirm.working': 'Working…',
    'confirm.typeWord': 'Type “{word}” to confirm:',
    'confirm.deleteWord': 'DELETE',

    'common.delete': 'Delete',
    'common.deletePermanently': 'Delete permanently',
    'surveys.deleteTitle': 'Delete survey permanently',
    'surveys.confirmDelete':
      'The survey from “{name}” and all of its ratings will be permanently deleted. This cannot be undone.',
    'surveys.deleted': 'Survey permanently deleted',
    'surveys.deleteAll': 'Delete all surveys',
    'surveys.deleteAllTitle': 'Delete all surveys permanently',
    'surveys.confirmDeleteAll':
      'Every survey and its ratings will be deleted and cannot be recovered. Rating criteria and users are kept.',
    'surveys.deletedAll': 'Deleted {surveys} surveys and {ratings} ratings',
    'ratings.deleteTitle': 'Delete rating permanently',
    'ratings.confirmDelete': 'The “{name}” rating will be permanently removed from this survey.',
    'ratings.deleted': 'Rating deleted',
    'criteria.deleteTitle': 'Delete criterion permanently',
    'criteria.confirmDelete':
      '“{name}” will be permanently deleted. A criterion that has ratings cannot be deleted.',
    'criteria.deleted': 'Rating criterion permanently deleted',
    'users.deleteTitle': 'Delete user permanently',
    'users.confirmDelete':
      '“{name}” will be permanently deleted. To suspend the account instead, deactivate it.',
    'users.deleted': 'User permanently deleted',

    'survey.title': 'Service Evaluation Survey',
    'survey.headerTitle': 'FiberX service evaluation survey',
    'survey.headerTitle2': 'for business partners',
    'survey.step': 'Step {step} of {total}',
    'survey.contactHeading': 'Contact details',
    'survey.companyLabel': 'Company / organisation',
    'survey.phoneLabel': 'Phone number',
    'survey.phoneInvalid': 'Enter a valid 11-digit number starting with 07',
    'survey.companyMissing': 'Please enter the company or organisation name',
    'survey.notesTitle': 'Your notes help us keep improving our service',
    'survey.notesLabel': 'Notes and suggestions',
    'survey.notesDisclaimer':
      'Note: we may feature some comments in our social media content',
    'survey.ratingsHeading': 'Rate our service',
    'survey.ratingsSub': 'Please rate each of the following',
    'survey.optional': '(optional)',
    'survey.best': '{value} : Excellent',
    'survey.worst': '{value} : Poor',
    'survey.pickRating': 'Please choose a rating',
    'survey.notesPlaceholder': 'Share your thoughts or experience with the service',
    'survey.next': 'Next',
    'survey.submit': 'Submit rating',
    'survey.resubmit': 'Resend',
    'survey.sending': 'Sending…',
    'survey.loading': 'Loading the survey…',
    'survey.loadFailed': 'Could not load the survey',
    'survey.partialSaved': 'Your details were saved — press Resend to finish the rating.',
    'survey.successTitle': 'Your rating was received',
    'survey.successTitle2': 'and goes straight to our team',
    'survey.successSub': 'Thank you for your time and trust in FiberX',
    'survey.returning': 'Returning to the home page in {seconds} seconds…',

    'notFound.title': 'Page not found',
    'notFound.message': 'The page you asked for could not be found.',
    'notFound.toDashboard': 'Back to the dashboard',
    'notFound.toLogin': 'Go to sign in',

    'error.network': 'Could not reach the server, check your connection',
    'error.400': 'The request is not valid',
    'error.401': 'Your session expired, please sign in again',
    'error.403': 'You do not have permission to view this data',
    'error.404': 'The item was not found',
    'error.409': 'Data conflict',
    'error.500': 'A server error occurred, please try again later',
    'error.generic': 'An error occurred',
  },
} as const

export type MessageKey = keyof (typeof MESSAGES)['ar']

function readStored(): Locale | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === 'ar' || raw === 'en' ? raw : null
  } catch {
    // Private mode or blocked storage: fall back to the default.
    return null
  }
}

const locale = ref<Locale>(readStored() ?? 'ar')

export const isRtl = computed(() => locale.value === 'ar')

/** Keeps <html> in step so CSS logical properties flip with the locale. */
function applyToDocument(next: Locale) {
  const el = document.documentElement
  el.lang = next
  el.dir = next === 'ar' ? 'rtl' : 'ltr'
}

applyToDocument(locale.value)

/**
 * Looks up a key, substituting {placeholders}.
 * A missing key returns the key itself, which surfaces the gap rather than
 * rendering an empty element.
 */
function translate(key: MessageKey, params?: Record<string, string | number>): string {
  const table = MESSAGES[locale.value] as Record<string, string>
  let text = table[key] ?? (MESSAGES.ar as Record<string, string>)[key] ?? key
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}

function setLocale(next: Locale) {
  locale.value = next
  applyToDocument(next)
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Persistence is a convenience; the choice still applies to this session.
  }
}

export const i18n = {
  locale,
  isRtl,
  t: translate,
  setLocale,
  toggle: () => setLocale(locale.value === 'ar' ? 'en' : 'ar'),
}

/** Convenience for `const { t } = useI18n()` inside components. */
export function useI18n() {
  return { t: translate, locale, isRtl, setLocale, toggle: i18n.toggle }
}
