FROM nginx:alpine

# Copy all static files to nginx's web root
COPY . /usr/share/nginx/html

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Configure nginx to listen on port 8080
RUN sed -i 's/listen       80;/listen       8080;/' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
