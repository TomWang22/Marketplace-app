# Use the official Node.js image as the base image
FROM node:14

# Install PM2 globally
RUN npm install -g pm2

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 5000
EXPOSE 5000

# Start the application using PM2
CMD ["pm2-runtime", "ecosystem.config.js", "--env", "production", "--no-daemon"]
