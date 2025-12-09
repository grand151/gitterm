FROM nginx:alpine

COPY ./apps/new-proxy/nginx.conf.template /etc/nginx/conf.d/default.conf.template

COPY ./apps/new-proxy/docker-entrypoint.sh /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
