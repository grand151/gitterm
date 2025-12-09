#!/usr/bin/env sh
set -eu

envsubst '${INTERNAL_API_KEY}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

rm /etc/nginx/conf.d/default.conf.template

exec "$@"