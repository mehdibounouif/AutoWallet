COMPOSE_FILE = docker-compose.yml

all:
	@echo "Building AutoWallet infrastructure..."
	docker compose -f $(COMPOSE_FILE) up -d --build

up:
	@echo "Starting containers..."
	docker compose -f $(COMPOSE_FILE) up -d

stop:
	@echo "Stopping containers..."
	docker compose -f $(COMPOSE_FILE) stop

down:
	@echo "Shutting down containers..."
	docker compose -f $(COMPOSE_FILE) down
	docker compose -f $(COMPOSE_FILE) ps --all

ps:
	@echo "Displaying container status..."
	docker compose -f $(COMPOSE_FILE) ps --all

images:
	@echo "Displaying images..."
	docker compose -f $(COMPOSE_FILE) images

logs:
	@echo "Displaying logs..."
	docker compose -f $(COMPOSE_FILE) logs -f

shell:
	@if [ -z "$(s)" ]; then echo "Usage: make shell s=<service>"; exit 1; fi
	docker compose -f $(COMPOSE_FILE) exec $(s) sh

test: test-backend test-gateway test-frontend

test-backend:	@echo "Running backend tests..."
	cd backend && ([ -f .env ] || cp .env.example .env) && ./venv/bin/pytest tests -q

test-gateway:
	@echo "Running api-gateway tests..."
	cd api-gateway && ([ -d node_modules ] || npm ci) && npm test

test-frontend: 
	@echo "Running frontend tests..."
	cd frontend && ([ -d node_modules ] || npm ci) && npm test

front-end:
	@echo "Rebuilding the frontend..."
	docker compose -f $(COMPOSE_FILE) up -d --build frontend

back-end:
	@echo "Rebuilding the backend..."
	docker compose -f $(COMPOSE_FILE) up -d --build backend

clean:
	@echo "Stopping and removing containers, networks, images and volumes..."
	docker compose -f $(COMPOSE_FILE) down --rmi all -v

fclean: clean
	@echo "WARNING: pruning the ENTIRE Docker system (every project on this machine)..."
	docker system prune -af --volumes

re: fclean all

.PHONY: all up stop down ps images logs shell front-end back-end test test-backend test-gateway test-frontend clean fclean re
