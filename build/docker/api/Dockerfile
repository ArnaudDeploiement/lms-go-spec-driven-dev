# syntax=docker/dockerfile:1.6

FROM golang:1.22-alpine AS builder
ENV GOTOOLCHAIN=auto
WORKDIR /src
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/api ./cmd/api

FROM gcr.io/distroless/base-debian12:nonroot
ENV API_ADDR=:8080
WORKDIR /app
COPY --from=builder /out/api /app/api
EXPOSE 8080
ENTRYPOINT ["/app/api"]
