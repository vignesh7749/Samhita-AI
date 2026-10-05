import sys
import types
from pathlib import Path

# Ensure backend directory and project root are in sys.path
_current_dir = Path(__file__).resolve().parent   # backend/
_project_root = _current_dir.parent              # project root

for _p in [str(_project_root), str(_current_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

if "backend" not in sys.modules:
    _backend_pkg = types.ModuleType("backend")
    _backend_pkg.__path__ = [str(_current_dir)]
    sys.modules["backend"] = _backend_pkg

# Expose the single existing FastAPI app instance from backend/app/main.py
from backend.app.main import app

__all__ = ["app"]
