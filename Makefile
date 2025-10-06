GOCACHE ?= $(PWD)/.cache/go-build

.PHONY: tidy fmt lint test generate up down

tidy:
	go mod tidy

fmt:
	go fmt ./...

lint:
	golangci-lint run ./...

test:
	GOCACHE=$(GOCACHE) go test ./...

generate:
	go generate ./...

up:
	docker compose up --build

down:
	docker compose down -v
