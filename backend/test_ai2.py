import sys
import os
import traceback

with open("test_ai_output.txt", "w") as f:
    try:
        from services.sign_detector import detector
        f.write("Success")
    except Exception as e:
        f.write(traceback.format_exc())
