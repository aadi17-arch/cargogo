.PHONY: dev install up down db-migrate db-studio clean

dev:
	npm run dev

install:
	npm install
	npm run install -w backend
	npm run install -w frontend

up:
	docker-compose up -d

down:
	docker-compose down

db-migrate:
	npm run db:migrate -w backend

db-studio:
	npm run db:studio -w backend

clean:
	rm -rf node_modules backend/node_modules frontend/node_modules backend/dist frontend/dist
