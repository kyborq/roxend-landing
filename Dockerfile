# # Устанавливаем Node.js 20 (подходит для Astro 5.x)
# FROM node:20-alpine AS builder

# # Рабочая директория
# WORKDIR /app

# # Копируем package.json и package-lock.json
# COPY package*.json ./

# # Устанавливаем зависимости
# RUN npm install

# # Копируем весь проект
# COPY . .

# # Сборка проекта Astro
# RUN npm run build

# # ---- Production stage ----
# FROM node:20-alpine

# WORKDIR /app

# # Копируем готовый билд из builder
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/package*.json ./

# # Устанавливаем только prod зависимости
# RUN npm install --omit=dev

# # Экспонируем порт (Traefik будет проксировать)
# EXPOSE 3000

# # Запуск Astro Node server
# CMD ["node", "./dist/server/entry.mjs"]

FROM node:lts AS runtime

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321

CMD node ./dist/server/entry.mjs