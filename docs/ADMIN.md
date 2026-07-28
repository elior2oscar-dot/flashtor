# Admin access (FlashTor)

## 1. פורטל בעל עסק (ציבורי מהדף הראשי)

- **כניסה:** [דף הבית](https://elior2oscar-dot.github.io/flashtor/) → «כניסה לפורטל הניהול»
- **ישירות:** `https://elior2oscar-dot.github.io/flashtor/portal/{slug}`
- דוגמה: `/flashtor/portal/e2e-demo` (אחרי seed)

המשתמש מתחבר עם **אותו חשבון Supabase** כמו באפליקציית המובייל. המערכת בודקת ש-`business_members` (או `owner_profiles`) שייך ל-`slug` של העסק.

יכולות: תורים קרובים, ביטול תור (כולל המתנה), רשימת המתנה, העתקת קישור הזמנה ללקוחות.

---

## 2. אדמין פלטפורמה (נסתר — ללא קישור באתר)

- **כתובת ישירה בלבד:** `https://elior2oscar-dot.github.io/flashtor/admin`
- לא מקושר מהדף הראשי או מהפוטר.

### הפעלה חד-פעמית ב-Supabase

1. החילו מיגרציה `007_platform_admins.sql` (או `supabase db push`).
2. צרו משתמש Auth (אם אין) לאופרטור הפלטפורמה.
3. הוסיפו אותו לטבלת האדמינים (SQL Editor, service role / dashboard):

```sql
insert into public.platform_admins (user_id)
select id from auth.users where email = 'YOUR_ADMIN_EMAIL@example.com'
on conflict (user_id) do nothing;
```

4. התחברו ב-`/admin` עם אימייל וסיסמה.

יכולות: סקירת כל העסקים, ספירות תורים/המתנה, הפעלה/השבתת עסק, קישור לפורטל בעלים.

---

## הערות אבטחה

- שני הממשקים משתמשים ב-**מפתח anon** + **RLS** — לא מפתח service role בדפדפן.
- אדמין פלטפורמה דורש שורה ב-`platform_admins`.
- אחרי מיגרציה חדשה, פרסמו מחדש את האתר ב-GitHub Pages אם שיניתם רק את ה-web; שינויי RLS הם ב-Supabase בלבד.
