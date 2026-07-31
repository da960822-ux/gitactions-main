server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name ${DOMAIN};
    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    location / {
        root   /usr/share/nginx/html;
        index  index.html;
        try_files $uri $uri/ /index.html;
    }
    location /api/ {
        proxy_pass http://${BACKEND_HOST}:8080/api/;
        proxy_set_header Host $host;
    }
}
