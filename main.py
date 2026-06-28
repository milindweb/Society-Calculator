import os
import sys
import traceback
import webview
from backend.api import Api

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")

if __name__ == "__main__":
    try:
        index_url = os.path.join(FRONTEND_DIR, "index.html")
        api = Api()
        window = webview.create_window(
            "Society Calculator",
            url=index_url,
            js_api=api,
            width=1024,
            height=720,
            resizable=True,
            min_size=(800, 600),
        )
        webview.start()
        print("webview.start() returned - window was closed", file=sys.stderr)
    except Exception:
        traceback.print_exc()
        input("Press Enter to exit...")