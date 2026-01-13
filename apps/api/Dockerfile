FROM node:20-bookworm-slim
WORKDIR /app
RUN apt-get update   && apt-get install -y openssl ca-certificates procps   && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN chmod +x ./docker-entrypoint.sh
EXPOSE 8080
CMD ["sh","./docker-entrypoint.sh"]