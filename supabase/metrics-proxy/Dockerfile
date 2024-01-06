FROM nginx:latest

# Remove default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY nginx.conf.template /etc/nginx/conf.d/

# Expose port 8080
EXPOSE 8080

# Start Nginx
CMD ["/bin/bash", "-c", "envsubst < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
