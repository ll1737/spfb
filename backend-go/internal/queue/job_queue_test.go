package queue

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestJobQueue_AsyncExecution(t *testing.T) {
	jq := NewJobQueue()

	jq.RegisterHandler("test.generate", func(ctx context.Context, job *AsyncJob, updateProgress func(progress int, step string)) (map[string]interface{}, error) {
		updateProgress(50, "处理中...")
		time.Sleep(50 * time.Millisecond)
		return map[string]interface{}{
			"output": "success_result",
		}, nil
	})

	job := jq.Enqueue("tenant_01", "creator_01", "proj_01", "test.generate", nil)
	if job == nil || job.ID == "" {
		t.Fatalf("failed to enqueue job")
	}

	// Poll until completed
	for i := 0; i < 20; i++ {
		time.Sleep(20 * time.Millisecond)
		j, ok := jq.GetJob(job.ID)
		if !ok {
			t.Fatalf("job not found in queue")
		}
		if j.Status == JobStatusSuccess {
			if j.Progress != 100 {
				t.Errorf("expected progress 100, got %d", j.Progress)
			}
			if j.Result["output"] != "success_result" {
				t.Errorf("unexpected output: %v", j.Result)
			}
			return
		}
	}
	t.Fatalf("job timed out")
}

func TestJobQueue_ErrorHandler(t *testing.T) {
	jq := NewJobQueue()

	jq.RegisterHandler("test.fail", func(ctx context.Context, job *AsyncJob, updateProgress func(progress int, step string)) (map[string]interface{}, error) {
		return nil, errors.New("simulated error")
	})

	job := jq.Enqueue("tenant_01", "creator_01", "proj_01", "test.fail", nil)

	for i := 0; i < 20; i++ {
		time.Sleep(20 * time.Millisecond)
		j, _ := jq.GetJob(job.ID)
		if j.Status == JobStatusFailed {
			if j.ErrorMessage != "simulated error" {
				t.Errorf("unexpected error message: %s", j.ErrorMessage)
			}
			return
		}
	}
	t.Fatalf("failed job timed out")
}
