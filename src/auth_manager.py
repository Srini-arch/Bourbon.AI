import uuid
import json
import time
from pathlib import Path
from filelock import FileLock

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

def get_auth_config():
    auth_file = DATA_DIR / 'auth_config.json'
    if auth_file.exists():
        with open(auth_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def manage_session(action, token=None, client=None, username=None):
    session_file = DATA_DIR / 'active_sessions.json'
    lock = FileLock(str(session_file) + '.lock', timeout=5)
    with lock:
        sessions = {}
        if session_file.exists():
            try:
                with open(session_file, 'r', encoding='utf-8') as f:
                    sessions = json.load(f)
            except Exception:
                sessions = {}
        
        # Cleanup expired (older than 24h)
        current_time = time.time()
        sessions = {k: v for k, v in sessions.items() if current_time - v.get('timestamp', 0) < 86400}

        if action == 'create':
            new_token = str(uuid.uuid4())
            sessions[new_token] = {
                'client': client,
                'username': username,
                'timestamp': current_time
            }
            with open(session_file, 'w', encoding='utf-8') as f:
                json.dump(sessions, f)
            return new_token
        
        elif action == 'verify':
            if token in sessions:
                sessions[token]['timestamp'] = current_time # refresh
                with open(session_file, 'w', encoding='utf-8') as f:
                    json.dump(sessions, f)
                return sessions[token]
            return None
            
        elif action == 'delete':
            if token and token in sessions:
                del sessions[token]
                with open(session_file, 'w', encoding='utf-8') as f:
                    json.dump(sessions, f)
            return True
