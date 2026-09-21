FROM node:22-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev
COPY . .
WORKDIR /app/server
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node","src/app.js"]
