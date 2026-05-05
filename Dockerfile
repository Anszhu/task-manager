FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY web/package.json web/package.json

RUN npm install

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4300
ENV DB_FILE=/app/server/data/team-task-manager.sqlite

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY web/package.json web/package.json

RUN npm install --omit=dev

COPY --from=build /app/server/dist server/dist
COPY --from=build /app/server/src/db/schema.sql server/src/db/schema.sql
COPY --from=build /app/web/dist web/dist

EXPOSE 4300

CMD ["npm", "run", "start", "-w", "server"]
