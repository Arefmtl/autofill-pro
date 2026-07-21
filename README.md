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
</p>

<p align="center">
  Smart Chrome extension that auto-fills job application forms from client resumes
</p>

---

## 🎯 What is AutoFill Pro?

AutoFill Pro is a Chrome extension designed for **recruiters, HR professionals, and freelancers** who need to fill out job application forms across multiple websites.

### Key Features

| Feature | Description |
|---------|-------------|
| 📄 **Resume Upload** | Supports PDF, DOCX, TXT, JPG, PNG files |
| 🌐 **Multi-Language** | Persian (فارسی), German (Deutsch), English |
| 🤖 **Smart Detection** | Matches fields by name, ID, placeholder, and labels |
| 🚀 **One-Click Fill** | Fill entire forms with a single click |
| 🔄 **File Converter** | PDF → JSON/CSV/HTML/Markdown |
| 📎 **File Upload** | Auto-detects resume and photo upload fields |
| 🔒 **Privacy First** | Everything stored locally — no external servers |
| 🎨 **Modern UI** | Dark theme with smooth animations |
| ⚡ **Lightweight** | Only 1.4MB — no performance impact |

---

## 📸 Screenshots

<div align="center">

| Upload Resume | File Converter |
|:---:|:---:|
| ![Upload](banner.png) | ![Convert](banner.png) |

</div>

---

## 🚀 Quick Start

### Installation

1. **Download** or clone this repository:
   ```bash
   git clone https://github.com/Arefmtl/autofill-pro.git
   ```

2. Open Chrome and navigate to `chrome://extensions`

3. Enable **Developer mode** (toggle in top right)

4. Click **Load unpacked**

5. Select the `autofill-pro` folder

6. Pin the extension to your toolbar ⚡

### Usage

1. **Click the extension icon** ⚡ in your toolbar
2. **Upload a resume** (PDF, DOCX, TXT, or image)
3. **Review** the extracted data in the Profile tab
4. **Navigate** to any job application form
5. **Click "Fill Form"** or right-click → AutoFill Pro
6. ✅ **Done!** Fields are filled automatically

---

## 🔄 File Converter

Convert files between formats:

| Input | Output |
|-------|--------|
| PDF | TXT, JSON, CSV, HTML, Markdown |
| DOCX | TXT, JSON, CSV, HTML, Markdown |
| TXT | JSON, CSV, HTML, Markdown |
| JPG/PNG | Text (OCR - requires API) |

### Batch Convert
- Upload multiple files at once
- Convert all to the same format
- Download individually or as a batch

---

## 🌐 Supported Websites

AutoFill Pro works on **any website** with form fields:

| Platform | Status |
|----------|--------|
| [LinkedIn](https://linkedin.com) | ✅ Optimized |
| [StepStone.de](https://stepstone.de) | ✅ Optimized |
| [Indeed.de](https://indeed.de) | ✅ Optimized |
| [Xing.com](https://xing.com) | ✅ Optimized |
| [Glassdoor](https://glassdoor.com) | ✅ Optimized |
| [Monster.de](https://monster.de) | ✅ Optimized |
| [Jobbörse (BA)](https://arbeitsagentur.de) | ✅ Optimized |
| Any other website | ✅ Auto-detect |

---

## 🧠 How It Works

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Upload      │     │  Parse       │     │  Match      │
│  Resume      │────▶│  Extract     │────▶│  Fields     │
│  (PDF/DOCX)  │     │  Data        │     │  (AI/Rule)  │
└─────────────┘     └──────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Visual      │◀────│  Fill        │◀────│  Detect     │
│  Feedback    │     │  Fields      │     │  Form       │
│  (Green)     │     │  (Native)    │     │  Elements   │
└─────────────┘     └──────────────┘     └─────────────┘
```

---

## 📁 Project Structure

```
autofill-pro/
├── manifest.json              # Chrome Extension Manifest V3
├── banner.png                 # Repository banner
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── lib/
│   ├── pdf.min.mjs           # PDF.js library
│   └── pdf.worker.min.mjs
├── popup/
│   ├── popup.html             # Extension popup UI
│   ├── popup.css              # Styles (Dark theme)
│   └── popup.js               # Upload, convert & fill logic
├── content/
│   └── content.js             # Form detection & filling
├── background/
│   └── service-worker.js      # Background tasks
└── README.md
```

---

## ⚙️ Configuration

### Settings Tab

| Setting | Description | Default |
|---------|-------------|---------|
| API Key | Optional AI enhancement (OpenAI/Anthropic) | Empty |
| Auto-fill enabled | Auto-detect forms on page load | ✅ On |
| Job sites only | Only activate on job boards | ❌ Off |
| Allowed sites | Comma-separated whitelist | Empty |

---

## 🛠️ Development

### Prerequisites

- Google Chrome (or Chromium-based browser)
- Basic knowledge of Chrome Extensions

### Local Development

```bash
# Clone the repo
git clone https://github.com/Arefmtl/autofill-pro.git
cd autofill-pro

# Load in Chrome
# 1. Open chrome://extensions
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select this folder

# Make changes and click refresh on the extension card
```

---

## 📝 Changelog

### v1.2 (Latest)
- ✅ Added File Converter (PDF → JSON/CSV/HTML/Markdown)
- ✅ Batch file conversion
- ✅ Download/Copy results
- ✅ Auto-detect source format

### v1.1
- ✅ Integrated pdf.js for proper PDF text extraction
- ✅ Added JSZip for DOCX parsing
- ✅ Improved resume parsing

### v1.0
- ✅ Initial release
- ✅ Resume upload and parsing
- ✅ Smart form detection
- ✅ One-click fill
- ✅ Multi-language support

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Ali Kazemi** — [@Arefmtl](https://github.com/Arefmtl)

- LinkedIn: [ali-kzm](https://linkedin.com/in/ali-kzm)
- GitHub: [Arefmtl](https://github.com/Arefmtl)

---

<div align="center">

**If this project helped you, please give it a ⭐ on GitHub!**

</div>

</div>
