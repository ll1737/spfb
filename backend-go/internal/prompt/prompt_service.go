package prompt

import (
	"bytes"
	"context"
	"fmt"
	"text/template"

	"gorm.io/gorm"
	"zhiyu-backend/internal/domain"
)

type PromptService struct {
	db *gorm.DB
}

func NewPromptService(db *gorm.DB) *PromptService {
	return &PromptService{db: db}
}

// Default prompts built into the system
var defaultTemplates = map[string]string{
	"topic.generate.v1": `你是一名资深的社交媒体内容主理人和选题专家。
请为创作者【{{.CreatorName}}】（领域：{{.Profession}}，语气风格：{{.ToneStyle}}）生成 {{.Count}} 个高吸引力、高传播潜力的选题。

【创作者人设与要求】：
{{.SystemPrompt}}
{{if .ProhibitedExpressions}}【禁止出现的词汇/表达】：{{range .ProhibitedExpressions}}- {{.}}
{{end}}{{end}}
{{if .PreferredExpressions}}【偏好的表达风格/口吻】：{{range .PreferredExpressions}}- {{.}}
{{end}}{{end}}
{{if .CoreMemories}}【创作者核心经历与长期观点】：{{range .CoreMemories}}- {{.}}
{{end}}{{end}}
{{if .BrandRules}}【品牌调性与规则】：
{{.BrandRules}}{{end}}

请直接输出 JSON 数组格式，每个选题包含字段：
- "title": 选题标题（吸睛、符合平台爆款特征）
- "angle": 创作切入角度
- "heatScore": 预估热度分（1-100）
- "tags": 标签数组
- "reason": 推荐理由`,

	"master_content.generate.v1": `你是一名全网顶级内容总编。请根据以下选题和创作者人设，创作一篇高质量的“母稿”（Master Content）。
母稿是后续派生小红书图文、抖音短视频脚本、公众号长文和视频号的核心底稿。

【创作者】：{{.CreatorName}} ({{.Profession}})
【人设风格】：{{.ToneStyle}}
【人设核心指令】：{{.SystemPrompt}}
{{if .BrandRules}}【品牌规则】：{{.BrandRules}}{{end}}
{{if .CoreMemories}}【核心经验与观点】：{{range .CoreMemories}}- {{.}}
{{end}}{{end}}

【选题标题】：{{.TopicTitle}}
【切入角度】：{{.Angle}}

请按以下 JSON 结构输出：
{
  "title": "母稿主标题",
  "summary": "100字内容概要",
  "hook": "黄金前3秒/前2行抓人眼球的吸睛钩子",
  "corePoints": ["核心要点1", "核心要点2", "核心要点3"],
  "body": "完整的母稿正文（逻辑严密、细节生动、观点鲜明）",
  "cta": "引导互动/转化话术（Call To Action）"
}`,

	"platform.xhs.rewrite.v1": `你是一名小红书爆款图文创作者。请将以下【母稿内容】改写为符合小红书平台风格的高互动图文文案。

【母稿标题】：{{.MasterTitle}}
【吸睛钩子】：{{.MasterHook}}
【核心正文】：{{.MasterBody}}
【引导话术】：{{.MasterCTA}}

【小红书风格要求】：
1. 标题必须有吸引力（使用符号、数字、痛点或悬念，20字内）。
2. 正文排版大量使用 Emoji 增强视觉层次，多分段，行文口语化、接地气。
3. 结尾设置自然的问题引发评论区互动。
4. 附带 3-5 个高热度话题标签（#xxx）。

请输出最终可直接发布的小红书文案：`,

	"platform.douyin.script.v1": `你是一名抖音短视频爆款编导。请将以下【母稿内容】改写为 60 秒短视频口播/剧情脚本。

【母稿标题】：{{.MasterTitle}}
【吸睛钩子】：{{.MasterHook}}
【核心正文】：{{.MasterBody}}
【引导话术】：{{.MasterCTA}}

【抖音脚本要求】：
1. 【0-3秒 黄金Hook】：瞬间抓取注意力，提出反常识问题或巨大痛点。
2. 【4-45秒 核心价值】：节奏明快，语言简练，配合镜头画面提示（[镜头画面]/[文字贴片]）。
3. 【46-60秒 结尾升华+点赞引导】：引导关注、点赞和评论区讨论。

请输出完整的脚本分镜文案：`,

	"content.ai_review.v1": `你是一名资深的内容合规与品牌质量审核专家。请对以下内容进行全方位审核并给出评分与建议：

【创作者人设与规范】：{{.SystemPrompt}}
【品牌规则】：{{.BrandRules}}
【待审内容】：
{{.ContentText}}

请从以下维度打分（1-100）并检测潜在风险，严格输出 JSON 格式：
{
  "overallScore": 88,
  "personaScore": 90,
  "brandScore": 85,
  "complianceScore": 95,
  "platformScore": 88,
  "passed": true,
  "risks": ["潜在风险点1", "潜在风险点2"],
  "suggestions": ["修改建议1", "修改建议2"]
}`,
}

// Render compiles and executes a prompt template with given data
func (s *PromptService) Render(ctx context.Context, tenantID string, templateCode string, data interface{}) (string, error) {
	tmplContent := ""

	// 1. Check if there is a tenant-specific or global override in the database
	if s.db != nil {
		var pt domain.PromptTemplate
		err := s.db.WithContext(ctx).
			Where("code = ? AND (tenant_id = ? OR tenant_id IS NULL OR tenant_id = '') AND status = 'active'", templateCode, tenantID).
			Order("tenant_id DESC, version DESC").
			First(&pt).Error
		if err == nil && pt.Template != "" {
			tmplContent = pt.Template
		}
	}

	// 2. Fallback to default in-memory template
	if tmplContent == "" {
		defaultTmpl, ok := defaultTemplates[templateCode]
		if !ok {
			return "", fmt.Errorf("prompt template '%s' not found", templateCode)
		}
		tmplContent = defaultTmpl
	}

	// 3. Execute template
	tmpl, err := template.New(templateCode).Parse(tmplContent)
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.String(), nil
}
