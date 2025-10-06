package main

import (
	"context"
	"log"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	log.Println("worker: starting background runner")
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	if err := run(ctx); err != nil {
		log.Fatalf("worker: fatal error: %v", err)
	}

	log.Println("worker: shutdown complete")
}

func run(ctx context.Context) error {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
			// Placeholder task.
			log.Println("worker: heartbeat tick")
		}
	}
}
