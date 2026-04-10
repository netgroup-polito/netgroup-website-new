FROM nginx:alpine

# Copy the static website files to the nginx html directory
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY src/ /usr/share/nginx/html/src/
COPY data/ /usr/share/nginx/html/data/

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
