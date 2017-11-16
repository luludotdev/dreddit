# Alpine Node Image
FROM node:carbon-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package info
COPY package.json yarn.lock ./

# Install app dependencies
RUN apk add --no-cache bash git openssh make gcc g++ python && \
  yarn install && \
  apk del bash git openssh make gcc g++ python

# Bundle app source
COPY . .

# Start Node.js
CMD [ "node", "." ]
