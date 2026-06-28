# Society Calculator

A lightweight offline desktop application for Co-operative Credit Societies. Performs loan sanction, final settlement, fixed deposit calculations, and more.

## Tech Stack

- **Backend:** Python 3
- **Database:** SQLite
- **Frontend:** HTML / CSS / JavaScript
- **Desktop:** PyWebView
- **Packaging:** PyInstaller (Windows & Linux)

## Project Structure

```
society-calculator/
├── main.py              # Entry point
├── backend/             # Python business logic
│   ├── api.py           # API exposed to JS bridge
│   └── database.py      # SQLite initialization and helpers
├── frontend/            # HTML, CSS, JavaScript UI
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── database/            # SQLite database file
├── docs/                # SRS and documentation
├── assets/              # Images, icons, fonts
├── backups/             # Database backups
├── dist/                # Packaged application
├── build.sh             # Linux build script
├── build.bat            # Windows build script
└── requirements.txt     # Python dependencies
```

## Getting Started

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python main.py
```

## Build

```bash
# Linux
./build.sh

# Windows
build.bat
```

## License

© 2026 Aarti Tech Services. All Rights Reserved.
