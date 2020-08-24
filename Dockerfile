FROM node:12-alpine AS builder
WORKDIR /usr/app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn test && yarn build

FROM node:12-alpine
ENV NODE_ENV=production

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

COPY package.json yarn.lock ./
RUN apk add --no-cache tini && \
  yarn install --frozen-lockfile --production

USER node
COPY --from=builder --chown=node:node /usr/app/build ./build
COPY --from=builder --chown=node:node /usr/app/config ./config

VOLUME ["/home/node/app/config"]
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "."]
