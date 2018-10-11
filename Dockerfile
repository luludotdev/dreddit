# Alpine Node Image
FROM node:10-alpine

# Create app directory
WORKDIR /usr/app

# Copy package info
COPY package.json package-lock.json ./

# Install app dependencies
RUN apk add --no-cache tini bash git openssh && \
  npm ci && \
  apk del bash git openssh

# Bundle app source
COPY . .

# Mount cache volume
VOLUME ["/usr/app/src/cache"]

# Start Node.js
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "."]
