FROM mysteriumnetwork/myst:latest AS myst

FROM node:18.18.0-alpine

RUN apk add --no-cache sudo iptables && \
    ln -s /sbin/iptables /usr/sbin/iptables

COPY --from=myst /usr/bin/myst /usr/bin/myst

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

COPY start-services.sh /start-services.sh
RUN chmod +x /start-services.sh
CMD ["/start-services.sh"]
