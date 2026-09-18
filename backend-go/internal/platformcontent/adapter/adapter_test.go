package adapter

import (
	"testing"
)

func TestXHSAdapter(t *testing.T) {
	adp := NewXHSAdapter()

	if adp.Platform() != "xiaohongshu" {
		t.Fatalf("expected platform xiaohongshu, got %s", adp.Platform())
	}

	raw := `标题：牙齿美白必看指南！
每天坚持这3个好习惯，牙齿真的会变白哦✨
#牙齿美白 #护牙干货 #口腔护理`

	res, err := adp.Normalize(raw)
	if err != nil {
		t.Fatalf("Normalize failed: %v", err)
	}

	if res.Title != "牙齿美白必看指南！" {
		t.Errorf("unexpected title: %s", res.Title)
	}

	if len(res.Hashtags) != 3 {
		t.Errorf("expected 3 hashtags, got %d", len(res.Hashtags))
	}

	if err := adp.Validate(res); err != nil {
		t.Errorf("Validate failed: %v", err)
	}
}

func TestDouyinAdapter(t *testing.T) {
	adp := NewDouyinAdapter()

	if adp.Platform() != "douyin" {
		t.Fatalf("expected platform douyin, got %s", adp.Platform())
	}

	raw := `标题：为什么天天刷牙还是有牙结石？
【0-3秒】你是不是也天天刷牙，但牙缝里还是有一层黄黄硬硬的东西？
【4-40秒】其实，普通的牙刷根本刷不掉已经矿化的牙结石...`

	res, err := adp.Normalize(raw)
	if err != nil {
		t.Fatalf("Normalize failed: %v", err)
	}

	if res.Title != "为什么天天刷牙还是有牙结石？" {
		t.Errorf("unexpected title: %s", res.Title)
	}

	if err := adp.Validate(res); err != nil {
		t.Errorf("Validate failed: %v", err)
	}
}
