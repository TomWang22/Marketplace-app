FROM node:14

# Install PM2 globally
RUN npm install -g pm2

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4003

# Use PM2 to start the service
CMD ["pm2-runtime", "ecosystem.config.js", "--env", "production", "--no-daemon"]
