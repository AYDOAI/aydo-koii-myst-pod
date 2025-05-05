#!/bin/sh

/usr/bin/myst --mmn.api-key="$MYST_API_KEY" --vendor.id=AYDO service --agreed-terms-and-conditions &

cd /app
node dist/index.js
