package idgen

import (
	"crypto/rand"
	"fmt"
	"time"
)

// GenerateUUID generates a pseudorandom unique string
func GenerateUUID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

// GenerateID generates a prefixed timestamp-based ID
func GenerateID(prefix string) string {
	return fmt.Sprintf("%s_%d_%s", prefix, time.Now().UnixNano(), GenerateUUID()[:8])
}
