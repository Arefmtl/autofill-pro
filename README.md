<div align="center">

# ⚡ AutoFill Pro

![Banner](banner.png)

![Chrome](https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome&logoColor=white)
![Manifest](https://img.shields.io/badge/Manifest-V3-green)
![Version](https://img.shields.io/badge/Version-1.2-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Size](https://img.shields.io/badge/Size-1.5MB-purple)

**Smart Chrome extension that auto-fills job application forms from client resumes**

افزونه هوشمند کروم برای پر کردن خودکار فرم‌های کاریابی

[📥 Download v1.2](https://github.com/Arefmtl/autofill-pro/releases/download/v1.2/autofill-pro-v1.2.tar.gz) • [📖 Documentation](#-installation) • [🐛 Report Bug](https://github.com/Arefmtl/autofill-pro/issues)

</div>

---

## ✨ Features

<div align="center">

| 📄 Resume Upload | 🔄 File Converter | 🚀 One-Click Fill | 🌐 Multi-Language |
|:---:|:---:|:---:|:---:|
| PDF, DOCX, TXT, JPG, PNG | PDF → JSON/CSV/HTML/MD | Auto-detect & fill forms | FA / DE / EN |

| 🤖 Smart Detection | 📎 Auto Upload | 🔒 Privacy First | ⚡ Lightweight |
|:---:|:---:|:---:|:---:|
| Name, ID, placeholder matching | Resume & photo fields | All data stays local | Only 1.5MB |

</div>

---

## 🚀 Installation

### Option 1: Download Release (Recommended)

1. Download [autofill-pro-v1.2.tar.gz](https://github.com/Arefmtl/autofill-pro/releases/download/v1.2/autofill-pro-v1.2.tar.gz)
2. Extract the archive
3. Open Chrome → `chrome://extensions`
4. Enable **Developer mode** (top right toggle)
5. Click **Load unpacked**
6. Select the extracted `autofill-pro` folder
7. Pin the extension to your toolbar ⚡

### Option 2: Clone Repository

```bash
git clone https://github.com/Arefmtl/autofill-pro.git
```

Then follow steps 3-7 above.

---

## 📖 Usage

<div align="center">

```
📄 Upload Resume → 🔍 Auto-Detect Fields → 🚀 Fill Form → ✅ Done!
```

</div>

1. **Click the extension icon** ⚡ in your toolbar
2. **Upload a resume** (PDF, DOCX, TXT, or image)
3. **Review** the extracted data
4. **Navigate** to any job application form
5. **Click "Fill Form"** or right-click → AutoFill Pro
6. ✅ **Done!** Fields are filled automatically

---

## 🔄 File Converter

Convert files between formats:

```
┌─────────┐     ┌─────────────────────────┐
│  Input   │     │        Output           │
├─────────┤     ├─────────────────────────┤
│  PDF    │ ──▶ │  TXT, JSON, CSV, HTML   │
│  DOCX   │ ──▶ │  TXT, JSON, CSV, HTML   │
│  TXT    │ ──▶ │  JSON, CSV, HTML, MD    │
│  JPG    │ ──▶ │  Text (OCR)             │
└─────────┘     └─────────────────────────┘
```

- ✅ Batch conversion (multiple files at once)
- ✅ Download results as files
- ✅ Copy to clipboard
- ✅ Auto-detect source format

---

## 🌐 Supported Sites

AutoFill Pro works on **any website** with form fields:

| Job Board | Status | | Job Board | Status |
|-----------|--------|-|-----------|--------|
| LinkedIn | ✅ | | StepStone.de | ✅ |
| Indeed.de | ✅ | | Xing.com | ✅ |
| Glassdoor | ✅ | | Monster.de | ✅ |
| Jobbörse (BA) | ✅ | | Any website | ✅ |

---

## 📁 Project Structure

```
autofill-pro/
├── manifest.json          # Manifest V3 config
├── banner.png             # Repo banner
├── icons/                 # Extension icons
├── lib/                   # PDF.js library
├── popup/                 # Extension UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/               # Form detection
│   └── content.js
└── background/            # Service worker
    └── service-worker.js
```

---

## 📋 Changelog

### v1.2 — Latest
- 🔄 File Converter (PDF → JSON/CSV/HTML/Markdown)
- 📦 Batch file conversion
- 🖼️ Professional banner image
- 🌐 Bilingual README (EN/FA)

### v1.1
- 📄 PDF.js for proper PDF extraction
- 📝 JSZip for DOCX parsing
- 🔍 Improved resume parsing

### v1.0
- 🎉 Initial release
- 📄 Resume upload & parsing
- 🤖 Smart form detection
- 🚀 One-click fill
- 🌐 Multi-language support

---

## ⚙️ Settings

| Setting | Description | Default |
|---------|-------------|---------|
| API Key | Optional AI/OCR enhancement | Empty |
| Auto-fill | Auto-detect forms on page load | ✅ On |
| Job sites only | Only activate on job boards | ❌ Off |
| Allowed sites | Whitelist specific domains | Empty |

---

## 🛠️ Development

```bash
# Clone the repo
git clone https://github.com/Arefmtl/autofill-pro.git
cd autofill-pro

# Load in Chrome
# 1. chrome://extensions
# 2. Enable Developer mode
# 3. Load unpacked → Select this folder

# Make changes and click refresh on the extension card
```

---

## 📝 License

[MIT License](LICENSE) © 2026 [Ali Kazemi](https://github.com/Arefmtl)

---

<div align="center">

**If this helped you, please give it a ⭐**

[![Star History Chart](https://api.star-history.com/svg?repos=Arefmtl/autofill-pro&type=Date)](https://star-history.com/#Arefmtl/autofill-pro&Date)

</div>
