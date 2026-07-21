<div dir="ltr">

# ⚡ AutoFill Pro

<p align="center">
  <img src="banner.png" alt="AutoFill Pro Banner" width="100%">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome&logoColor=white" alt="Chrome Extension">
  <img src="https://img.shields.io/badge/Manifest-V3-green" alt="Manifest V3">
  <img src="https://img.shields.io/badge/Version-1.2-blue" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
  <img src="https://img.shields.io/badge/Size-1.5MB-purple" alt="Size">
</p>

<p align="center">
  <b>EN:</b> Smart Chrome extension that auto-fills job application forms from client resumes<br>
  <b>FA:</b> افزونه هوشمند کروم برای پر کردن خودکار فرم‌های کاریابی از رزومه کلاینت‌ها
</p>

---

## 🎯 About / درباره

<details>
<summary><b>🇬🇧 English</b></summary>

AutoFill Pro is a Chrome extension designed for **recruiters, HR professionals, and freelancers** who need to fill out job application forms across multiple websites. Simply upload a client's resume, and AutoFill Pro will automatically detect and fill in the relevant fields on any website.

</details>

<details>
<summary><b>🇮🇷 فارسی</b></summary>

AutoFill Pro یه افزونه کروم طراحی شده برای **کاریابی‌ها، متخصصان HR و فریلنسرها** که باید فرم‌های درخواست کار رو توی سایت‌های مختلف پر کنن. کافیه رزومه کلاینت رو آپلود کنید، AutoFill Pro خودش فیلدهای مرتبط رو توی هر سایتی پیدا و پر می‌کنه.

</details>

---

## ✨ Features / ویژگی‌ها

| Feature 🇬🇧 | ویژگی 🇮🇷 | Description |
|------------|----------|-------------|
| 📄 Resume Upload | آپلود رزومه | PDF, DOCX, TXT, JPG, PNG |
| 🌐 Multi-Language | چند زبانه | Persian, German, English |
| 🤖 Smart Detection | تشخیص هوشمند | Matches by name, ID, placeholder |
| 🚀 One-Click Fill | پر کردن با یک کلیک | Fill entire forms instantly |
| 🔄 File Converter | تبدیل فایل | PDF → JSON/CSV/HTML/Markdown |
| 📎 File Upload | آپلود فایل | Auto-detects upload fields |
| 🔒 Privacy First | امنیت اول | Everything stored locally |
| 🎨 Modern UI | رابط کاربری مدرن | Dark theme with animations |
| ⚡ Lightweight | سبک | Only 1.5MB |

---

## 🚀 Quick Start / شروع سریع

<details>
<summary><b>🇬🇧 English Installation</b></summary>

1. **Download** or clone this repository:
   ```bash
   git clone https://github.com/Arefmtl/autofill-pro.git
   ```

2. Open Chrome → `chrome://extensions`

3. Enable **Developer mode** (top right)

4. Click **Load unpacked**

5. Select the `autofill-pro` folder

6. Pin to toolbar ⚡

</details>

<details>
<summary><b>🇮🇷 نصب فارسی</b></summary>

1. **دانلود** یا کلون کنید:
   ```bash
   git clone https://github.com/Arefmtl/autofill-pro.git
   ```

2. کروم باز کنید → `chrome://extensions`

3. **Developer mode** رو روشن کنید (گوشه بالا راست)

4. **Load unpacked** رو بزنید

5. پوشه `autofill-pro` رو انتخاب کنید

6. به نوار ابزار اضافه کنید ⚡

</details>

---

## 📖 Usage / نحوه استفاده

<details>
<summary><b>🇬🇧 English</b></summary>

1. Click the extension icon ⚡
2. Upload a resume (PDF/DOCX/Text)
3. Review extracted data
4. Go to any job application form
5. Click "Fill Form" or right-click → AutoFill Pro
6. ✅ Done!

</details>

<details>
<summary><b>🇮🇷 فارسی</b></summary>

1. روی آیکون افزونه کلیک کنید ⚡
2. رزومه کلاینت رو آپلود کنید (PDF/DOCX/متن)
3. اطلاعات استخراج شده رو بررسی کنید
4. به سایت کاریابی برید
5. روی **🚀 پر کردن فرم** کلیک کنید
6. ✅ تموم!

</details>

---

## 🔄 File Converter / تبدیل فایل

<details>
<summary><b>🇬🇧 English</b></summary>

Convert files between formats:

| Input | Output |
|-------|--------|
| PDF | TXT, JSON, CSV, HTML, Markdown |
| DOCX | TXT, JSON, CSV, HTML, Markdown |
| TXT | JSON, CSV, HTML, Markdown |
| JPG/PNG | Text (OCR - requires API) |

**Batch Convert:** Upload multiple files and convert all at once.

</details>

<details>
<summary><b>🇮🇷 فارسی</b></summary>

تبدیل فایل بین فرمت‌ها:

| فرمت ورودی | فرمت خروجی |
|-----------|-----------|
| PDF | TXT, JSON, CSV, HTML, Markdown |
| DOCX | TXT, JSON, CSV, HTML, Markdown |
| TXT | JSON, CSV, HTML, Markdown |
| JPG/PNG | متن (OCR - نیاز به API) |

**تبدیل دسته‌ای:** چند فایل همزمان آپلود و تبدیل کنید.

</details>

---

## 🌐 Supported Sites / سایت‌های پشتیبانی شده

| Platform | Status |
|----------|--------|
| [LinkedIn](https://linkedin.com) | ✅ |
| [StepStone.de](https://stepstone.de) | ✅ |
| [Indeed.de](https://indeed.de) | ✅ |
| [Xing.com](https://xing.com) | ✅ |
| [Glassdoor](https://glassdoor.com) | ✅ |
| [Monster.de](https://monster.de) | ✅ |
| [Jobbörse (BA)](https://arbeitsagentur.de) | ✅ |
| Any website | ✅ Auto-detect |

---

## 📁 Project Structure / ساختار پروژه

```
autofill-pro/
├── manifest.json              # Manifest V3
├── banner.png                 # Repository banner
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── lib/
│   ├── pdf.min.mjs           # PDF.js
│   └── pdf.worker.min.mjs
├── popup/
│   ├── popup.html             # UI
│   ├── popup.css              # Styles
│   └── popup.js               # Logic
├── content/
│   └── content.js             # Form detection
└── background/
    └── service-worker.js      # Background
```

---

## 📋 Changelog / تغییرات

### v1.2 (Latest / جدیدترین)
- ✅ File Converter (PDF → JSON/CSV/HTML/Markdown)
- ✅ Batch file conversion
- ✅ Download/Copy results
- ✅ Banner image + bilingual README

### v1.1
- ✅ PDF.js for proper PDF extraction
- ✅ JSZip for DOCX parsing
- ✅ Improved resume parsing

### v1.0
- ✅ Initial release
- ✅ Resume upload & parsing
- ✅ Smart form detection
- ✅ One-click fill
- ✅ Multi-language support

---

## ⚙️ Settings / تنظیمات

| Setting 🇬🇧 | تنظیم 🇮🇷 | Default |
|------------|----------|---------|
| API Key | کلید API | Empty |
| Auto-fill | پر کردن خودکار | ✅ On |
| Job sites only | فقط سایت کاریابی | ❌ Off |
| Allowed sites | سایت‌های مجاز | Empty |

---

## 🛠️ Development / توسعه

```bash
# Clone
git clone https://github.com/Arefmtl/autofill-pro.git
cd autofill-pro

# Load in Chrome
# chrome://extensions → Load unpacked → Select folder

# Make changes and refresh
```

---

## 📝 License / مجوز

MIT License - see [LICENSE](LICENSE)

---

## 👨‍💻 Author / نویسنده

**Ali Kazemi (علی کاظمی)** — [@Arefmtl](https://github.com/Arefmtl)

- LinkedIn: [ali-kzm](https://linkedin.com/in/ali-kzm)
- GitHub: [Arefmtl](https://github.com/Arefmtl)

---

<div align="center">

**⭐ If this helped you, star the repo!**<br>
**اگه به کارت اومد، ⭐ بزن!**

</div>

</div>
