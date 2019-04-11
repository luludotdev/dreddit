# Alpine Node Image
FROM node:10-alpine AS builder

# Create app directory
WORKDIR /usr/app

# Copy package info
COPY package.json yarn.lock ./

# Install app dependencies
RUN apk add --no-cache tini bash git openssh
RUN npm i -g typescript
RUN yarn install --frozen-lockfile

# Build source
COPY . .
RUN yarn build

# Main Image
FROM node:10-alpine
ENV NODE_ENV=production

# Create app directory
WORKDIR /usr/app

# Copy built source
COPY package.json yarn.lock ./
COPY --from=builder /usr/app/build ./build
COPY --from=builder /usr/app/config ./config

# Install prod dependencies
RUN apk add --no-cache tini bash git openssh curl && \
  yarn install --frozen-lockfile --production && \
  apk del bash git openssh

# Start Node.js
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "."]
