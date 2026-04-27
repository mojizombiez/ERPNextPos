# ERPNext POS (MWinPOS)

A premium, high-performance Point of Sale (POS) application designed for seamless integration with **ERPNext**. Built with an offline-first architecture to ensure business continuity even during network outages.

## 🚀 Overview

MWinPOS leverages the power of **Wails (Go)** for backend system operations and **React (TypeScript)** for a stunning, glassmorphism-inspired user interface. It provides a robust, fast, and modern checkout experience tailored for retail and hospitality environments.

## ✨ Key Features

- **Offline-First Resilience**: Process sales and manage data without an active internet connection.
- **ERPNext Integration**: Real-time synchronization of products, prices, customers, and stock levels.
- **Premium Aesthetics**: Modern, dynamic design with high-quality micro-animations and themes.
- **Advanced Cart Engine**: Supports bundles, manual discounts (manager-authorized), and coupon codes.
- **Loyalty Program**: Full support for customer point redemption and membership tracking.
- **Hardware Integration**: Integrated support for barcode scanners, thermal receipt printers, and cash drawers.
- **Multi-Method Payments**: Flexible payment options including Cash, QR, Credit, and split payments.

## 🛠 Tech Stack

- **Backend**: Go (Golang)
- **Frontend**: React, TypeScript, TailwindCSS, Lucide Icons
- **Framework**: [Wails](https://wails.io)
- **Database**: SQLite (Local storage)

## 🏗 Setup & Development

### Prerequisites
- Go 1.20+
- Node.js & NPM
- Wails CLI (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

### Run Development Mode
```bash
wails dev
```
This will start the Vite dev server and the Go application with Hot Reloading.

### Build Production
```bash
wails build
```
The compiled executable will be located in the `build/bin` directory.

## 📝 Configuration
Project settings are managed via `wails.json` and environmental variables in the `.env` file (see `.env.example` for details).

---
*Created and maintained by [mojizombiez](https://github.com/mojizombiez)*
