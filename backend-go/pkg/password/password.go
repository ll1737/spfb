package password

import (
	"crypto/rand"
	"crypto/sha512"
	"encoding/hex"
)

// GenerateSalt creates a random hex salt
func GenerateSalt(length int) string {
	if length <= 0 {
		length = 16
	}
	bytes := make([]byte, length)
	_, _ = rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// HashPassword hashes password with salt matching Node.js sha512(password + salt)
func HashPassword(password, salt string) string {
	hasher := sha512.New()
	hasher.Write([]byte(password + salt))
	return hex.EncodeToString(hasher.Sum(nil))
}

// VerifyPassword verifies if input matches stored hash
func VerifyPassword(password, salt, storedHash string) bool {
	return HashPassword(password, salt) == storedHash
}
