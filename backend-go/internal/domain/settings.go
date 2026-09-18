package domain

type SystemSettings struct {
	WorkerURL             string `json:"workerUrl"`
	WorkerAPIKey          string `json:"workerApiKey"`
	WorkerAPIKeySet       bool   `json:"workerApiKeySet"`
	EncryptionKeySet      bool   `json:"encryptionKeySet"`
	BrowserHeadless       bool   `json:"browserHeadless"`
	BrowserPath           string `json:"browserPath,omitempty"`
	MaxConcurrency        int    `json:"maxConcurrency"`
	AutoRetryFailed       bool   `json:"autoRetryFailed"`
	MaxRetries            int    `json:"maxRetries"`
	SaveDebugScreenshots  bool   `json:"saveDebugScreenshots"`
	EnableStealth         bool   `json:"enableStealth"`
	UsePatchright         bool   `json:"usePatchright"`
	HumanTypingDelay      bool   `json:"humanTypingDelay"`
	SocialAutoUploadPath  string `json:"socialAutoUploadPath,omitempty"`
	IsDesktopMode         bool   `json:"isDesktopMode"`
}
