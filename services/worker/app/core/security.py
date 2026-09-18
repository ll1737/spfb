import hashlib
import json
import os
from typing import Dict, Any, Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from .config import config

def get_aes_key() -> bytes:
    return hashlib.sha256(config.APP_SECRET.encode("utf-8")).digest()

def encrypt_session(data: Dict[str, Any]) -> str:
    """Encrypts a Python dict into an AES-256-GCM hex string (iv:tag:ciphertext)"""
    key = get_aes_key()
    aesgcm = AESGCM(key)
    iv = os.urandom(12)
    plaintext = json.dumps(data).encode("utf-8")
    ciphertext_and_tag = aesgcm.encrypt(iv, plaintext, None)
    ciphertext = ciphertext_and_tag[:-16]
    tag = ciphertext_and_tag[-16:]
    return f"{iv.hex()}:{tag.hex()}:{ciphertext.hex()}"

def decrypt_session(encrypted_str: str) -> Optional[Dict[str, Any]]:
    """Decrypts an AES-256-GCM hex string back into Python dict"""
    if not encrypted_str:
        return None
    try:
        parts = encrypted_str.split(":")
        if len(parts) != 3:
            # Fallback if raw JSON or simple base64
            return json.loads(encrypted_str)
        iv = bytes.fromhex(parts[0])
        tag = bytes.fromhex(parts[1])
        ciphertext = bytes.fromhex(parts[2])
        key = get_aes_key()
        aesgcm = AESGCM(key)
        decrypted = aesgcm.decrypt(iv, ciphertext + tag, None)
        return json.loads(decrypted.decode("utf-8"))
    except Exception:
        return None
