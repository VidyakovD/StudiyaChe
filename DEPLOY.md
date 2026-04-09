# Деплой Студии ЧЕ

## Архитектура
- **Сервер РФ** — сайт (Next.js), БД (PostgreSQL)
- **Сервер EU/US** — прокси для OpenAI API

---

## 1. Прокси-сервер (EU/US) — настройка за 5 минут

SSH на зарубежный сервер:

```bash
# Установить Nginx
sudo apt update && sudo apt install -y nginx

# Настроить прокси для OpenAI
sudo tee /etc/nginx/sites-available/openai-proxy <<'EOF'
server {
    listen 8443 ssl;
    server_name _;

    # Самоподписанный сертификат (или Let's Encrypt)
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location /v1/ {
        proxy_pass https://api.openai.com/v1/;
        proxy_set_header Host api.openai.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_ssl_server_name on;

        # Ограничить доступ только с IP российского сервера
        # allow YOUR_RU_SERVER_IP;
        # deny all;
    }
}
EOF

# SSL сертификат (самоподписанный для начала)
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/key.pem \
  -out /etc/nginx/ssl/cert.pem \
  -subj "/CN=openai-proxy"

# Активировать
sudo ln -sf /etc/nginx/sites-available/openai-proxy /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

---

## 2. Основной сервер (РФ)

### 2.1 Установка софта

```bash
sudo apt update && sudo apt upgrade -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Nginx
sudo apt install -y nginx

# PM2 (менеджер процессов)
sudo npm install -g pm2

# Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### 2.2 Настройка PostgreSQL

```bash
sudo -u postgres psql
```

```sql
CREATE USER studiache WITH PASSWORD 'СИЛЬНЫЙ_ПАРОЛЬ';
CREATE DATABASE learning_platform OWNER studiache;
GRANT ALL PRIVILEGES ON DATABASE learning_platform TO studiache;
\q
```

### 2.3 Клонирование проекта

```bash
cd /var/www
sudo git clone https://github.com/VidyakovD/StudiyaChe.git
cd StudiyaChe
sudo chown -R $USER:$USER .
```

### 2.4 Настройка .env

```bash
cat > .env <<'EOF'
DATABASE_URL="postgresql://studiache:СИЛЬНЫЙ_ПАРОЛЬ@localhost:5432/learning_platform"
NEXTAUTH_SECRET="СГЕНЕРИРОВАТЬ_ДЛИННЫЙ_СЕКРЕТ"
NEXTAUTH_URL="https://your-domain.ru"
OPENAI_API_KEY="sk-proj-..."
OPENAI_BASE_URL="https://YOUR_EU_SERVER_IP:8443/v1"
YUKASSA_SHOP_ID="YOUR_SHOP_ID"
YUKASSA_SECRET_KEY="YOUR_SECRET_KEY"
EOF
```

Сгенерировать NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 2.5 Сборка и запуск

```bash
npm install
npx prisma migrate deploy
npm run seed
npm run build
pm2 start npm --name "studiache" -- start
pm2 save
pm2 startup
```

### 2.6 Nginx (основной сайт)

```bash
sudo tee /etc/nginx/sites-available/studiache <<'EOF'
server {
    listen 80;
    server_name your-domain.ru www.your-domain.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/studiache /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

### 2.7 SSL сертификат (Let's Encrypt)

```bash
sudo certbot --nginx -d your-domain.ru -d www.your-domain.ru
```

---

## 3. Обновление сайта

```bash
cd /var/www/StudiyaChe
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart studiache
```

---

## 4. Полезные команды

```bash
pm2 status              # Статус приложения
pm2 logs studiache      # Логи
pm2 restart studiache   # Перезапуск
pm2 monit               # Мониторинг
```
