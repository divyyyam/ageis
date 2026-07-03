

# 🛡️ Ageis

### On-Chain Agricultural Traceability & Marketplace

---

## 📌 Overview

**Ageis** is a blockchain-integrated agricultural marketplace that tokenizes farm produce as on-chain NFTs to ensure authenticity, provenance, and verifiable ownership.

Unlike a traditional CRUD marketplace, Ageis combines:

* Relational database consistency
* On-chain NFT minting
* Deterministic metadata serving
* Containerized deployment
* Reverse proxy + SSL infrastructure

This project demonstrates production-grade Web2 + Web3 interoperability.

---

## 🧠 System Architecture

```
Client (React / Next.js)
        ↓
NGINX (SSL Termination + Reverse Proxy)
        ↓
Node.js + Express (TypeScript API)
        ↓
Prisma ORM
        ↓
PostgreSQL (Neon Serverless)
        ↓
Solana Blockchain (NFT Minting + Metadata)
```

---

## ⚙️ Tech Stack

### Backend

* Node.js
* Express
* TypeScript
* Prisma ORM
* PostgreSQL (Neon)

### Blockchain

* Solana
* NFT Minting
* On-chain metadata linking
* Keypair generation per mint

### Infrastructure

* Docker (multi-stage builds)
* PM2 (process management)
* NGINX (reverse proxy)
* Certbot (SSL automation)
* Ubuntu-based deployment

---

## 🔗 Blockchain Integration

Ageis bridges off-chain relational state with on-chain NFT ownership.

### NFT Minting Flow

1. Farmer registers → stored in PostgreSQL
2. Farmer wallet keys stored in `FarmerKeys`
3. Product creation triggers:

   * New mint keypair generation
   * Metadata JSON construction
   * Metadata served via backend endpoint
   * NFT minted on Solana
   * Mint address persisted in database

---

### Example Metadata Structure

```json
{
  "name": "Organic Apples Batch #102",
  "description": "Farm fresh apples from Nashik",
  "origin": "Nashik, India",
  "harvest_date": "2026-02-27",
  "farmer_wallet": "...",
  "image": "https://..."
}
```

### Engineering Challenges Solved

* Synchronizing DB state with blockchain state
* Preventing inconsistent mint states on transaction failure
* Public metadata resolution
* Secure wallet key management

---

## 🗄️ Database Design

### Core Models

* `User`
* `Farmer`
* `FarmerKeys`
* `Product`
* `Order`

### Architectural Decisions

* NFT mint address stored inside `Product`
* Wallet isolation using `FarmerKeys`
* Order creation updates product state deterministically
* Strong relational integrity between farmer → product → order

---

## 📦 Ordering System (No Payment Layer)

The ordering layer supports:

* Buyer order placement
* Product status updates
* Persistent order tracking
* Extensible NFT ownership transfer logic

Designed to be upgradeable to:

* Escrow smart contracts
* SPL token payments
* On-chain ownership reassignment

---

## 🐳 Containerization

### Multi-Stage Docker Build

* Base image with build dependencies
* Cached dependency layer
* TypeScript compilation layer
* Optimized production runtime

### Benefits

* Reduced image size
* Reproducible builds
* Prisma compatibility with Alpine
* Secure runtime isolation

---

## 🌐 Reverse Proxy & SSL

### NGINX Responsibilities

* SSL termination
* HTTP → HTTPS redirection
* Proxying to internal API (port 4000)
* Header forwarding & security hardening

### SSL

* Automated certificate provisioning via Certbot
* Renewable TLS certificates
* Enforced HTTPS in production

---

## 🔒 Security Considerations

* Environment variable isolation
* SSL-enabled database connections
* Docker network isolation
* Controlled wallet key storage
* Prisma migration management
* HTTPS-only API exposure

---

## ⚡ DevOps Complexity

Ageis addresses:

* Neon serverless PostgreSQL connection pooling
* Prisma initialization inside Docker
* SSL + domain configuration
* PM2 lifecycle management
* Zero-downtime restart after deployment

---

## 🏗️ Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

---

## 🐳 Docker

```bash
# Build image
docker build -t ageis-api .

# Run container
docker run -p 4000:4000 ageis-api
```

---

## 🚀 Production Deployment

1. Deploy Docker container
2. Configure NGINX reverse proxy
3. Setup SSL via Certbot
4. Use PM2 for process management
5. Configure `PUBLIC_BASE_URL` for metadata resolution

---

## 📈 Scalability Roadmap

* On-chain NFT ownership transfer
* Escrow-based payment integration
* SPL token support
* DAO-based dispute resolution
* AI-driven produce grading
* IoT farm sensor integration
* Cross-border certification verification

---

## 🎯 Technical Significance

Ageis demonstrates:

* Full-stack TypeScript architecture
* Web2 + Web3 interoperability
* On-chain asset lifecycle management
* Production-grade infrastructure setup
* Blockchain-backed provenance system

This project is architected as a distributed asset authentication platform — not just a marketplace.

Contact me to build something great like ths : divyamm.xyz

