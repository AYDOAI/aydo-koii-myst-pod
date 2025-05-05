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

COPY <<EOF /start-services.sh
#!/bin/sh

/usr/bin/myst --mmn.api-key=$MYST_API_KEY --vendor.id=AYDO service --agreed-terms-and-conditions &

cd /app
node dist/index.js
EOF

RUN chmod +x /start-services.sh

CMD ["/start-services.sh"]
