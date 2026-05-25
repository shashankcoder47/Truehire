# TrueHire Production Deploy

Replace `example.com` with the real domain before running these commands.

## 1. Create AWS

```bash
cd Truehire/infra/aws
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

This creates EC2, RDS MySQL, S3, an EC2 IAM role for S3 uploads, and security groups.
The S3 template allows public read for uploaded objects because the current app stores direct file URLs. For private resumes/documents, add signed download routes before disabling public reads.

## 2. Prepare EC2

```bash
sudo apt update
sudo apt install -y git nginx certbot python3-certbot-nginx nodejs npm
sudo mkdir -p /opt/truehire /etc/truehire
sudo chown -R ubuntu:ubuntu /opt/truehire
```

Clone or copy the repository into `/opt/truehire`, then create:

```bash
sudo cp Truehire/deploy/env/backend.env.example /etc/truehire/backend.env
sudo cp Truehire/deploy/env/frontend.env.example /etc/truehire/frontend.env
sudo nano /etc/truehire/backend.env
sudo nano /etc/truehire/frontend.env
```

Use the Terraform outputs for `DATABASE_URL`, `AWS_S3_BUCKET`, and `AWS_S3_PUBLIC_URL`.

## 3. Build And Run

```bash
cd /opt/truehire/Truehire/backend
npm ci
npx prisma generate
npx prisma migrate deploy

cd /opt/truehire/Truehire/frontend
npm ci
npm run build

sudo cp /opt/truehire/Truehire/deploy/systemd/truehire-backend.service /etc/systemd/system/
sudo cp /opt/truehire/Truehire/deploy/systemd/truehire-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now truehire-backend truehire-frontend
```

## 4. Nginx And HTTPS

```bash
sudo cp /opt/truehire/Truehire/deploy/nginx/truehire.conf /etc/nginx/sites-available/truehire
sudo sed -i 's/example.com/your-domain.com/g' /etc/nginx/sites-available/truehire
sudo ln -sf /etc/nginx/sites-available/truehire /etc/nginx/sites-enabled/truehire
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 5. Test

```bash
curl -I https://your-domain.com
curl https://your-domain.com/api/health
sudo systemctl status truehire-backend truehire-frontend nginx
sudo journalctl -u truehire-backend -n 100 --no-pager
sudo journalctl -u truehire-frontend -n 100 --no-pager
```

Create a test profile photo, recruiter verification document, company logo, and resume upload. The returned file URLs should point at the S3 bucket, not the EC2 `/uploads` path.
