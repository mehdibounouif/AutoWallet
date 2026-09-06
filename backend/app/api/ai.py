"""
AI API router integration for AutoWallet.
Connects the standalone ai_module into the core FastAPI backend application.
"""

import sys
from pathlib import Path

# Ensure project root is in sys.path
root_dir = Path(__file__).resolve().parents[3]
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from ai_module.router import router

__all__ = ["router"]
