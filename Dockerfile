# Alpine Node Image
FROM node:carbon-alpine

# Create app directory
WORKDIR /usr/app

# Copy package info
COPY package.json yarn.lock ./

# Install app dependencies
RUN apk add --no-cache tini bash git openssh make gcc g++ python && \
  yarn install && \
  apk del bash git openssh make gcc g++ python

# Bundle app source
COPY . .

# Mount cache volume
VOLUME ["/usr/app/src/cache"]

# Start Node.js
ENTRYPOINT ["/sbin/tini", "--"]
CMD [ "node", "." ]
