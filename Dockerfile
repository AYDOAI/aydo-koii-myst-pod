FROM mysteriumnetwork/myst:latest AS myst

FROM node:18.18.0-alpine

RUN apk add --no-cache sudo iptables python3 make gcc g++ && \
    ln -s /sbin/iptables /usr/sbin/iptables

COPY --from=myst /usr/bin/myst /usr/bin/myst

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

COPY <<EOF /start-services.sh
#!/bin/sh

/usr/bin/myst service --agreed-terms-and-conditions &

cd /app
npm start
EOF

RUN chmod +x /start-services.sh

CMD ["/start-services.sh"]
