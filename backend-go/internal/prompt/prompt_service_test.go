package prompt

import (
	"context"
	"strings"
	"testing"
)

func TestPromptService_Render(t *testing.T) {
	svc := NewPromptService(nil)

	ctx := context.Background()
	data := map[string]interface{}{
		"CreatorName":  "张医生",
		"Profession":   "口腔医学专家",
		"ToneStyle":    "通俗易懂",
		"SystemPrompt": "为大众科普牙齿健康知识",
		"TopicTitle":   "如何正确使用牙线",
		"Angle":        "常见误区解答",
		"Count":        3,
	}

	// 1. Topic generation template
	topicPrompt, err := svc.Render(ctx, "tenant_1", "topic.generate.v1", data)
	if err != nil {
		t.Fatalf("failed to render topic prompt: %v", err)
	}
	if !strings.Contains(topicPrompt, "张医生") || !strings.Contains(topicPrompt, "口腔医学专家") {
		t.Errorf("rendered prompt missing creator information: %s", topicPrompt)
	}

	// 2. Master content template
	masterPrompt, err := svc.Render(ctx, "tenant_1", "master_content.generate.v1", data)
	if err != nil {
		t.Fatalf("failed to render master content prompt: %v", err)
	}
	if !strings.Contains(masterPrompt, "如何正确使用牙线") {
		t.Errorf("rendered prompt missing topic title: %s", masterPrompt)
	}
}
