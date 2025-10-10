GOCACHE ?= $(PWD)/.cache/go-build

.PHONY: tidy fmt lint test generate up down clean minio-cors

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

clean:
	@echo "🧹 Nettoyage complet (containers + volumes + images)..."
	docker compose down -v
	docker volume prune -f
	@echo "✅ Nettoyage terminé. Toutes les données ont été supprimées."

minio-cors:
	tools/minio/apply-cors.sh
