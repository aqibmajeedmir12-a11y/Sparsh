import sys
import os

try:
    from services.sign_detector import detector
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()
