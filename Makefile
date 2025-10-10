.PHONY: help build run run-detached stop seed logs

COMPOSE ?= docker compose
PYTHON ?= python

help:
	@echo "Available targets:"
	@echo "  make build          # Build application and database containers"
	@echo "  make run            # Start the stack in the foreground"
	@echo "  make run-detached   # Start the stack in the background"
	@echo "  make stop           # Stop and remove containers"
	@echo "  make seed           # Populate the database with sample data"
	@echo "  make logs           # Tail application logs"

build:
	$(COMPOSE) build

run:
	$(COMPOSE) up

run-detached:
	$(COMPOSE) up -d

stop:
	$(COMPOSE) down -v

seed:
	$(COMPOSE) exec web $(PYTHON) scripts/seed_data.py

logs:
	$(COMPOSE) logs -f web
