# 📖 مراجعة التربية الإسلامية — الصف السابع

تطبيق ويب تفاعلي لمراجعة مادة التربية الإسلامية للصف السابع، الفصل الدراسي الثالث.

## المحتوى
- **١٠ مجموعات اختبارية** × **٢٠ سؤالاً** = **٢٠٠ سؤال**
- **المواضيع:** سورة الرحمن (٥٤-٧٨) | صلاة التطوع | صلح الحديبية | أحكام التجويد
- **أنواع الأسئلة:** اختيار متعدد | صح وخطأ | تعبئة الفراغ | أسئلة مقالية
- **التصحيح:** فوري للأسئلة الموضوعية | بالذكاء الاصطناعي (Groq) للمقالية

---

## 🚀 النشر على Vercel

### 1. احصل على مفتاح Groq API
1. توجّه إلى [console.groq.com](https://console.groq.com)
2. سجّل حساباً مجانياً
3. أنشئ مفتاح API جديد (API Key)

### 2. ارفع المشروع على GitHub
```bash
git init
git add .
git commit -m "Initial commit: Islamic exam app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/islamic-exam.git
git push -u origin main
```

### 3. انشر على Vercel
1. توجّه إلى [vercel.com](https://vercel.com) وسجّل الدخول
2. اضغط **"Add New Project"** واستورد المستودع من GitHub
3. في إعدادات المشروع، أضف متغير البيئة:
   - **Name:** `GROQ_API_KEY`
   - **Value:** مفتاح Groq الذي حصلت عليه
4. اضغط **Deploy**

### 4. التشغيل المحلي (للتطوير)
```bash
# ثبّت Vercel CLI
npm install

# أنشئ ملف .env.local
cp .env.example .env.local
# عدّل .env.local وأضف مفتاح Groq

# شغّل المشروع محلياً
npm run dev
# افتح http://localhost:3000
```

---

## 📁 هيكل المشروع
```
islamic-exam/
├── public/
│   ├── index.html      # الصفحة الرئيسية
│   ├── style.css       # التنسيق
│   ├── questions.js    # بيانات الأسئلة (200 سؤال)
│   └── app.js          # منطق التطبيق
├── api/
│   └── grade.js        # دالة Vercel للتصحيح بالذكاء الاصطناعي
├── package.json
├── vercel.json
├── .env.example
└── README.md
```

---

## ⚙️ تخصيص الأسئلة
لإضافة أو تعديل أسئلة، عدّل ملف `public/questions.js`.
كل سؤال يأخذ أحد الأشكال:

```js
// اختيار متعدد
{ id:"1-1", type:"mcq", topic:"سورة الرحمن",
  text:'نص السؤال',
  options:["أ","ب","ج","د"],
  correct: 0, // رقم الإجابة الصحيحة (0-3)
  explanation:'شرح الإجابة' }

// صح وخطأ
{ id:"1-2", type:"tf", topic:"التجويد",
  text:'العبارة للتقييم',
  correct: true, // أو false
  explanation:'شرح الإجابة' }

// تعبئة الفراغ
{ id:"1-3", type:"fill", topic:"صلاة التطوع",
  text:'السؤال مع فراغ ___',
  answer:'الإجابة الصحيحة',
  hint:'تلميح اختياري' }

// سؤال مقالي (يُصحَّح بالذكاء الاصطناعي)
{ id:"1-4", type:"short", topic:"صلح الحديبية",
  text:'نص السؤال المقالي',
  modelAnswer:'الإجابة النموذجية الكاملة' }
```
