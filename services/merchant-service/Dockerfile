FROM node:14

# Install psql and PM2
RUN apt-get update && apt-get install -y postgresql-client && npm install -g pm2

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4007

# Use PM2 to start the service
CMD ["pm2-runtime", "ecosystem.config.js", "--env", "production", "--no-daemon"]
