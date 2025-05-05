#!/bin/sh
set -e

# Запускаем myst в фоне
/usr/bin/myst --mmn.api-key="$MYST_API_KEY" --vendor.id=AYDO service --agreed-terms-and-conditions &
MYST_PID=$!

# Функция для завершения myst при остановке контейнера
cleanup() {
  echo "Stopping myst (PID $MYST_PID)..."
  kill $MYST_PID
  wait $MYST_PID
  exit 0
}

trap cleanup SIGINT SIGTERM

exec "$@" 
