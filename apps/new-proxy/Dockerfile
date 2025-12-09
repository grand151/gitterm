FROM nginx:alpine

# Copy nginx template to the templates directory
# The nginx entrypoint will automatically process templates with envsubst (nginx 1.19+)

RUN mkdir -p /etc/ssl/certs /etc/ssl/private

USER nginx;

COPY ./apps/new-proxy/gitterm.dev.pem /etc/ssl/certs/gitterm.pem;
COPY ./apps/new-proxy/gitterm.dev.key /etc/ssl/private/gitterm.key;

RUN chmod 644 /etc/ssl/certs/gitterm.pem
RUN chmod 600 /etc/ssl/private/gitterm.key

COPY ./apps/new-proxy/nginx.conf /etc/nginx/nginx.conf

# COPY ./nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]