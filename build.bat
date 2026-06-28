@echo off
echo Building Society Calculator for Windows...
pip install -r requirements.txt
pip install pyinstaller
pyinstaller --onefile --windowed ^
  --name "SocietyCalculator" ^
  --add-data "frontend;frontend" ^
  --hidden-import webview ^
  --hidden-import webview.platforms.cef ^
  --hidden-import webview.platforms.winforms ^
  main.py
echo Build complete. Executable in dist\SocietyCalculator.exe
