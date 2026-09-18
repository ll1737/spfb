package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"strings"
)

// Helper to derive 32-byte key from app secret
func deriveKey(appSecret string) []byte {
	hash := sha256.Sum256([]byte(appSecret))
	return hash[:]
}

// EncryptToken encrypts plaintext using AES-256-GCM matching Node.js: ivHex:tagHex:cipherHex
func EncryptToken(plaintext, appSecret string) (string, error) {
	key := deriveKey(appSecret)
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	// 12-byte IV for GCM
	iv := make([]byte, 12)
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return "", err
	}

	// In Go, gcm.Seal appends the 16-byte tag to the end of the ciphertext
	sealed := gcm.Seal(nil, iv, []byte(plaintext), nil)
	if len(sealed) < 16 {
		return "", errors.New("sealed payload is too short")
	}

	ciphertext := sealed[:len(sealed)-16]
	tag := sealed[len(sealed)-16:]

	return fmt.Sprintf("%s:%s:%s",
		hex.EncodeToString(iv),
		hex.EncodeToString(tag),
		hex.EncodeToString(ciphertext),
	), nil
}

// DecryptToken decrypts ivHex:tagHex:cipherHex format
func DecryptToken(encryptedData, appSecret string) (string, error) {
	parts := strings.Split(encryptedData, ":")
	if len(parts) != 3 {
		return encryptedData, nil // return as-is if not formatted
	}

	iv, err := hex.DecodeString(parts[0])
	if err != nil {
		return "", fmt.Errorf("invalid iv hex: %w", err)
	}

	tag, err := hex.DecodeString(parts[1])
	if err != nil {
		return "", fmt.Errorf("invalid tag hex: %w", err)
	}

	ciphertext, err := hex.DecodeString(parts[2])
	if err != nil {
		return "", fmt.Errorf("invalid cipher hex: %w", err)
	}

	key := deriveKey(appSecret)
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	// In Go, gcm.Open expects ciphertext followed by the 16-byte tag
	sealed := append(ciphertext, tag...)
	plaintext, err := gcm.Open(nil, iv, sealed, nil)
	if err != nil {
		return "***", err
	}

	return string(plaintext), nil
}
