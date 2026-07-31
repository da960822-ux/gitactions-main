# 🛠️ 클라우드 멀티 서버 배포 및 네트워크 구축 종합 가이드 (Deployment Master Guide)

본 문서는 **Public Server (Frontend / Web)**와 **Private Server (Backend / AI Model / DB)** 분리 배포 환경에서의 **VPC 인프라 구성, NAT Gateway, ACG 보안 그룹 설정, 파일 수정사항 및 서버별 CLI 명령어**를 총정리한 종합 가이드입니다.

---

## ☁️ 1. 클라우드 VPC & 서브넷 (Subnet) 설계

- **VPC 이름**: `mood-vpc` (`10.0.0.0/16`)
- **Public Subnet**: `mood-public-subnet` (`10.0.1.0/24`) — 외부 인터넷과 직통 통신 (Public IP 할당)
- **Private Subnet**: `mood-private-subnet` (`10.0.2.0/24`) — 외부 직접 접속 완전 차단 (Private IP만 할당)

---

## 🌐 2. NAT Gateway (나트 게이트웨이) & 라우팅 설정

> **필요성**: Private 서버는 외부에서 들어오는 인바운드 접속은 차단하지만, 패키지 다운로드 (`apt-get update`, `docker pull`)를 위해 외부 인터넷으로 나가는 Outbound 트래픽 통로가 필요합니다.

1. **NAT Gateway 생성**:
   - **배치 위치**: Public Subnet (`mood-public-subnet`)
   - **이름**: `mood-nat-gw`
   - 공인 IP (Public IP) 1개 신규 할당 및 바인딩
2. **Private Subnet 라우팅 테이블 (`mood-private-rt`) 수정**:
   - **Destination**: `0.0.0.0/0`
   - **Target / Next Hop**: `mood-nat-gw` (NAT Gateway) 연결

---

## 🖥️ 3. 서버 명세 및 IP 할당 (Server List)

| 서버 이름 | 배치 서브넷 | 공인 IP (Public IP) | 사설 IP (Private IP) | 탑재 서비스 |
|---|---|---|---|---|
| **`mood-web-srv`** | Public Subnet | **할당함 (필수)** | `10.0.1.10` | React Web App, Nginx Reverse Proxy |
| **`mood-app-srv`** | Private Subnet | **할당 안 함 (N/A)** | `10.0.2.10` | Spring Boot (8080), FastAPI Model (8000) |
| **`mood-db-srv`** | Private Subnet | **할당 안 함 (N/A)** | `10.0.2.20` | MySQL 8.0 (3306) |

---

## 🛡️ 4. ACG (Access Control Group) 보안 그룹 설정

### 1) Public Server ACG (`mood-web-acg`)
- **적용 대상**: `mood-web-srv` (Public Subnet)

| 방향 (Direction) | 프로토콜 | 포트 범위 | 접근 출처 (Source / Destination) | 설명 |
|---|---|---|---|---|
| **Inbound** | TCP | 80 | `0.0.0.0/0` | 일반 유저 웹 HTTP 접속 |
| **Inbound** | TCP | 443 | `0.0.0.0/0` | 일반 유저 웹 HTTPS 접속 |
| **Inbound** | TCP | 22 | `관리자 IP (예: 211.x.x.x/32)` | SSH 관리자 접속 |
| **Outbound** | TCP | 8080 | `10.0.2.10/32` (Private Server IP) | Private 서버 백엔드로 프록시 전달 |
| **Outbound** | TCP | 80 / 443 | `0.0.0.0/0` | 외부 리소스 통신 |

---

### 2) Private Server ACG (`mood-app-acg`)
- **적용 대상**: `mood-app-srv` & `mood-db-srv` (Private Subnet)

| 방향 (Direction) | 프로토콜 | 포트 범위 | 접근 출처 (Source / Destination) | 설명 |
|---|---|---|---|---|
| **Inbound** | TCP | 8080 | `mood-web-acg` (`10.0.1.10/32`) | **Public 서버로부터의 REST API 요청만 허용** |
| **Inbound** | TCP | 22 | `10.0.1.10/32` (Public Server IP) | **Public 서버(Bastion Host)를 경유한 SSH 접속** |
| **Inbound** | TCP | 8000 | `10.0.2.10/32` (Self) | Spring Boot ➡️ FastAPI 모델 간 내부 연동 |
| **Inbound** | TCP | 3306 | `10.0.2.10/32` (Self) | Spring Boot ➡️ MySQL DB 간 내부 연동 |
| **Outbound** | ALL | ALL | `0.0.0.0/0` | **NAT Gateway를 통한 인터넷 패키지 다운로드** |

---

## 🔧 5. 분리 배포 시 필수 파일 수정사항

### Nginx 프록시 설정 (`frontend/nginx.conf`)
Public 서버에서 Private 서버 백엔드로 API 요청을 프록시하도록 설정:
```nginx
server {
    listen 80;

    location / {
        root   /usr/share/nginx/html;
        index  index.html;
        try_files $uri $uri/ /index.html;
    }

    # /api/* 요청을 Private 서버 사설 IP(10.0.2.10)로 전달
    location /api/ {
        proxy_pass http://10.0.2.10:8080/api/;
        proxy_set_header Host $host;
    }
}
```

---

## 📜 6. 서버별 CLI 명령어 실행 순서 (Deployment Commands)

### 6-1. Public Server (`mood-web-srv`) 실행 명령어
```bash
# 1. 패키지 업데이트 및 필요 도구(Git, Docker) 설치
sudo apt-get update -y
sudo apt-get install -y git docker.io docker-compose-v2

# 2. Docker 서비스 시작 및 권한 부여
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker

# 3. 프로젝트 저장소 클론 및 이동
git clone https://github.com/chani337/cloudpj.git
cd cloudpj

# 4. 프론트엔드 이미지 빌드 및 실행
cd frontend
docker build -t mood-frontend .
docker run -d -p 80:80 --restart unless-stopped --name mood-frontend mood-frontend

# 5. 상태 확인
docker ps
curl http://localhost
```

---

### 6-2. Private Server (`mood-app-srv` & `mood-db-srv`) 실행 명령어
```bash
# 1. 패키지 업데이트 및 필요 도구(Git, Docker) 설치
sudo apt-get update -y
sudo apt-get install -y git docker.io docker-compose-v2

# 2. Docker 서비스 시작 및 권한 부여
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker

# 3. 프로젝트 저장소 클론 및 이동
git clone https://github.com/chani337/cloudpj.git
cd cloudpj

# 4. 환경 변수(.env) 설정
cp .env.example .env

# 5. 백엔드(Spring Boot) + AI 모델(FastAPI) + DB(MySQL) 실행
docker compose -f docker-compose.local.yml up -d --build

# 6. 구동 상태 및 헬스체크
docker compose -f docker-compose.local.yml ps
curl http://localhost:8080/api/health

# 7. 실시간 로그 확인
docker compose -f docker-compose.local.yml logs -f
```

---

## 🔑 7. Private 서버 접속 방법 (Bastion Host)

Private 서버는 Public IP가 없으므로 Public 서버를 경유하여 접속합니다:
```bash
# 1단계: 내 PC -> Public 서버 접속
ssh -i /path/to/key.pem ubuntu@<Public-Server-공인IP>

# 2단계: Public 서버 -> Private 서버 내부 접속
ssh ubuntu@10.0.2.10
```
