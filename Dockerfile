FROM mysteriumnetwork/myst:latest AS myst

FROM node:18.18.0-alpine

RUN apk add --no-cache sudo iptables curl && \
    ln -s /sbin/iptables /usr/sbin/iptables

COPY --from=myst /usr/bin/myst /usr/bin/myst

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
