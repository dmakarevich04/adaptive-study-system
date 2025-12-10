# Dockerfile для React фронтенда
FROM node:18-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем все файлы
COPY . .

# Открываем порт
EXPOSE 3000

# Запускаем dev сервер
CMD ["npm", "start"]
