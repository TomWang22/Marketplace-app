FROM node:14

# Install PM2 globally
RUN npm install -g pm2

WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

EXPOSE 4002

# Use PM2 to start the service
CMD ["pm2-runtime", "ecosystem.config.js", "--env", "production", "--no-daemon"]
