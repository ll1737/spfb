package service

import "testing"

func TestParseGeneratedTopicsRejectsInvalidModelOutput(t *testing.T) {
	if _, err := ParseGeneratedTopics("not-json"); err == nil {
		t.Fatal("expected invalid AI topic output to fail")
	}
}

func TestParseGeneratedTopicsUsesOnlyModelReturnedData(t *testing.T) {
	rows, err := ParseGeneratedTopics(`[{"title":"真实选题","angle":"患者视角","heatScore":81,"tags":["种植牙"],"reason":"来自真实模型"}]`)
	if err != nil {
		t.Fatalf("parse topics: %v", err)
	}
	if len(rows) != 1 || rows[0].Title != "真实选题" || rows[0].HeatScore != 81 {
		t.Fatalf("unexpected topics: %#v", rows)
	}
}

func TestParseAIReviewRejectsInvalidModelOutput(t *testing.T) {
	if _, err := ParseAIReview("not-json"); err == nil {
		t.Fatal("expected invalid AI review output to fail")
	}
}
