import hashlib
import json
from typing import Optional, Dict, Any
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from .config import config

def get_encryption_key() -> bytes:
    return hashlib.sha256((config.APP_SECRET or 'multi_publish_secret_key_2026').encode('utf-8')).digest()

def decrypt_session(encrypted_data: str) -> Optional[Dict[str, Any]]:
    if not encrypted_data:
        return None
    try:
        parts = encrypted_data.split(':')
        if len(parts) != 3:
            # If plain JSON
            return json.loads(encrypted_data)
        iv = bytes.fromhex(parts[0])
        tag = bytes.fromhex(parts[1])
        ciphertext = bytes.fromhex(parts[2])
        
        # In AESGCM for python, tag is concatenated with ciphertext
        key = get_encryption_key()
        aesgcm = AESGCM(key)
        decrypted_bytes = aesgcm.decrypt(iv, ciphertext + tag, None)
        return json.loads(decrypted_bytes.decode('utf-8'))
    except Exception as e:
        return None

def encrypt_session(session_dict: Dict[str, Any]) -> str:
    try:
        text = json.dumps(session_dict, ensure_ascii=False)
        key = get_encryption_key()
        aesgcm = AESGCM(key)
        import os
        iv = os.urandom(12)
        encrypted = aesgcm.encrypt(iv, text.encode('utf-8'), None)
        # In cryptography AESGCM, output is ciphertext + tag (tag is last 16 bytes)
        tag = encrypted[-16:]
        ciphertext = encrypted[:-16]
        return f"{iv.hex()}:{tag.hex()}:{ciphertext.hex()}"
    except Exception as e:
        return json.dumps(session_dict)
