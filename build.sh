#!/bin/bash
echo "Building Society Calculator for Linux..."
pip install -r requirements.txt
pip install pyinstaller
pyinstaller --onefile --windowed \
  --name "SocietyCalculator" \
  --add-data "frontend:frontend" \
  --hidden-import webview \
  --hidden-import webview \
  --hidden-import webview.platforms.gtk \
  main.py
echo "Build complete. Executable in dist/SocietyCalculator"
