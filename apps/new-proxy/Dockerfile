FROM nginx:alpine

COPY ./apps/new-proxy/nginx.conf.template /etc/nginx/conf.d/default.conf.template

COPY ./apps/new-proxy/docker-entrypoint.sh /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Start nginx with the pre-substituted config
CMD ["nginx", "-g", "daemon off;"]

