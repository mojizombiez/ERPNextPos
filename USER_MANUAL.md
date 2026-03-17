# MWinPOS — User Manual

**Version:** 1.0  
**Platform:** Windows Desktop (Wails / ERPNext POS)  
**Audience:** Cashiers, Managers, Store Administrators

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [PIN Login](#2-pin-login)
3. [Checkout / POS Screen](#3-checkout--pos-screen)
4. [Payment Processing](#4-payment-processing)
5. [Multiple Order Sessions](#5-multiple-order-sessions)
6. [Order History](#6-order-history)
7. [Cash Drawer Management](#7-cash-drawer-management)
8. [Stock Management](#8-stock-management)
9. [Customer Management](#9-customer-management)
10. [Campaigns & Promotions](#10-campaigns--promotions)
11. [Delivery Orders](#11-delivery-orders)
12. [Admin Panel](#12-admin-panel)
13. [Settings](#13-settings)
14. [Customer Display](#14-customer-display)
15. [Barcode Scanner](#15-barcode-scanner)
16. [Data Sync & Offline Mode](#16-data-sync--offline-mode)
17. [Security & Auto-Lock](#17-security--auto-lock)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. Getting Started

MWinPOS is a Windows desktop Point-of-Sale application that integrates natively with **ERPNext**. It stores all data locally in an SQLite database and periodically syncs sales invoices to your ERPNext server.

### First Launch

On the very first launch (or after a Hard Reset):
- A default **Admin** staff account is automatically created.
- **Default PIN: `123456`**
- After logging in, immediately go to **Admin → Staff** to add your real staff accounts and change/remove the default Admin.

---

## 2. PIN Login

Every session starts at the **PIN Login** screen.

| Action | Description |
|---|---|
| Tap digits 0–9 | Enter your 6-digit passcode |
| **CLEAR** | Erase all digits and start over |
| ← (Backspace) | Delete the last digit |
| Auto-submit | The system validates automatically when the 6th digit is entered |

- If the PIN is correct, you are logged in and taken to the **Checkout** screen.
- If incorrect, an **"Invalid Passcode"** error is shown and the digits are cleared.
- **Manager operations** (e.g., removing an item from a cart) will prompt a separate PIN modal that requires a staff member with the **Manager** role.

---

## 3. Checkout / POS Screen

The main selling screen. It is divided into three panels:

### 3.1 Category Sidebar (Left)
- Lists all **ERPNext Item Groups** as category buttons.
- A special **"Sold Out"** category appears if any item has been disabled.
- Click a category to filter the product grid.

### 3.2 Product Grid (Centre)
- Displays all **available** items in the selected category.
- Each card shows: **item image**, **item code (SKU)**, **name**, and **price (฿)**.
- **Click a product** to add it to the cart (adds quantity 1 each click).
- **Sold-out toggle** (✖ button on each card): Temporarily marks an item as Sold Out without deleting it. Click the **+** button on a greyed card to re-enable it.

### 3.3 Cart / Order Panel (Right)
| Element | Action |
|---|---|
| **＋ / － buttons** | Increase or decrease item quantity |
| **Trash icon** | Remove item (requires Manager PIN) |
| **Print Kitchen** | Send the current order to the kitchen printer |
| **Clear** | Clear all items from the cart (confirmation required) |
| **Subtotal / VAT / Total** | Live-calculated totals (VAT = 7% included in price) |
| **Remaining amount row** | Click to add a payment method |
| **Pay Now** | Finalise the order (disabled until fully paid) |

After a successful checkout, the system navigates to the **Final Process** screen showing the change amount and optionally printing a receipt.

---

## 4. Payment Processing

Click the **Remaining Amount** row (or the **＋ Payment** area) to open the payment numpad.

### Supported Payment Methods
| Method | Icon |
|---|---|
| Cash | 💵 |
| Card | 💳 |
| QR / PromptPay | 📱 |
| Other (from POS Profile) | Custom |

### Split Payments
You can apply **multiple payment methods** to a single order:
1. Open the payment numpad and enter an amount for one method.
2. Click **Apply** — the payment is added.
3. Repeat for additional methods.
4. Applied payments are shown as chips above the "Remaining" row.
5. Hover a chip and click **✖** to remove it.

**Change** is displayed in green when the total paid (cash) exceeds the order total.

---

## 5. Multiple Order Sessions

The vertical **tab strip** on the right edge of the order panel allows managing multiple simultaneous orders (e.g., dine-in tables).

| Action | How |
|---|---|
| **Switch order** | Click a numbered tab |
| **New order** | Click the **＋** button at the bottom of the tab strip |
| **Cancel an order** | Click the small **✖** on a tab (confirmation required) |

Each session holds its own cart, payment state, and session number independently.

---

## 6. Order History

Navigate to **Orders** from the sidebar.

- Search and filter past orders by **date range**, **status**, and other criteria.
- View full order details, including items, payments, and totals.
- **Refund**: Open an order and issue a refund (creates a negative Sales Invoice in ERPNext).
- **Reprint**: Print a receipt for any past order.
- **Manual Sync**: Force a specific order to sync to ERPNext immediately.

---

## 7. Cash Drawer Management

Navigate to **Drawer** from the sidebar.

### Opening a Drawer
1. Enter the **starting cash balance**.
2. Click **Open Drawer** — this records your starting float.
3. A POS Opening Entry is created in ERPNext (if a POS Profile is configured).

### During the Session
- All cash sales are automatically tracked.
- You can pop the physical cash drawer tray via **Settings → Printers → Open Cash Drawer**.

### Closing a Drawer
1. Count the physical cash and enter the **actual cash amount**.
2. Click **Close Drawer**.
3. The system calculates cash over/short and creates a **POS Closing Entry** in ERPNext.
4. A closing summary is shown with total sales by payment method.

---

## 8. Stock Management

Navigate to **Stock** from the sidebar.

- View all products with their current ERPNext **item code**, name, price, and category.
- **Add a new product** manually (standalone mode) or products sync from ERPNext automatically (online mode).
- **Edit** any product's name, price, category, barcode, or image.
- **Delete** a product from the local database.
- **Toggle availability**: Enable or disable items for sale (same as the Sold Out toggle in checkout).
- **Upload product image**: Attach a local image to a product for display on the POS grid.
- **Print price tag**: Print a label with the product name and barcode.

---

## 9. Customer Management

Navigate to **Customers** from the sidebar.

- View all synced ERPNext customers.
- **Add** a new customer (name, phone, email, address).
- **Edit** or **delete** existing customers.
- Customers can be assigned to an order at the checkout stage.

---

## 10. Campaigns & Promotions

Navigate to **Campaigns** from the sidebar.

- View and manage **promotional rules** (discounts, bundle deals, etc.).
- Promotions are applied automatically during checkout when their conditions are met.
- Each promotion can have a **minimum order quantity**, **min/max cart value**, and per-category conditions.

---

## 11. Delivery Orders

Navigate to **Delivery** from the sidebar.

- Shows orders from the last 30 days that were flagged as delivery orders.
- View delivery details and sync status.

---

## 12. Admin Panel

Navigate to **Admin** from the sidebar. Requires a **Manager PIN** to enter.

### Staff Management
| Action | Description |
|---|---|
| **Add Staff** | Enter name, nickname, 6-digit PIN, and role (Cashier / Manager) |
| **Edit Staff** | Update any staff details or PIN |
| **Delete Staff** | Remove a staff member |
| **Toggle Active** | Deactivate a staff account (they cannot log in) |

> **Tip:** Create at least one Manager account before going live. Managers can approve item removals and access restricted areas.

### Dashboard (Admin)
- Quick summary of today's sales, order count, and top-selling items.

---

## 13. Settings

Navigate to **Settings** from the sidebar. Requires a **Manager PIN**.

Settings are organized into tabs:

### General
| Setting | Description |
|---|---|
| **Language** | Switch between 🇺🇸 English and 🇹🇭 Thai |
| **ERPNext Company** | The default company name for Sales Invoices |
| **ERPNext Warehouse** | Stock location associated with this terminal |
| **POS Profile** | Link to an ERPNext POS Profile (auto-fills warehouse & company) |
| **Operation Mode** | **Online** (syncs to ERPNext) or **Standalone** (local only) |
| **Skip Auto-Update** | Disable update check at startup |
| **Update Endpoint URL** | URL of the JSON update file for OTA updates |

### Connectivity (Online mode only)
| Setting | Description |
|---|---|
| **ERPNext URL** | Base URL of your ERPNext instance (e.g., `https://mysite.frappe.cloud`) |
| **Username / Password** | ERPNext API token credentials |
| **Test Connection** | Verify the URL is reachable |
| **Login** | Authenticate and store the token |
| **Sync Interval** | How often (in seconds) background sync runs |
| **Sync Batch Size** | Number of orders synced per batch |
| **Manual Sync** | Immediately sync all pending data |
| **Pre-cache** | Download all products/customers for offline use |

### Printers
| Setting | Description |
|---|---|
| **Cashier Printer** | Printer for customer receipts |
| **Kitchen Printer** | Separate printer for kitchen tickets |
| **Use Same Printer** | Send both receipts and kitchen bills to one printer |
| **Detect Printers** | Auto-discover Windows printers |
| **Check Status** | Verify a printer is online |
| **Open Cash Drawer** | Trigger the cash drawer solenoid via the receipt printer |

### Security
| Setting | Description |
|---|---|
| **Master PIN** | A universal override PIN (default: `123456`) — change this immediately |
| **Auto-Lock Timeout** | Seconds of inactivity before the screen locks and requires a PIN |

### Appearance
- Choose from **21 themes** (10 dark, 11 light), including: Midnight, Amethyst, Emerald, Crimson, Makro, etc.
- Theme changes preview live before saving.

### Scanner
- Test your barcode scanner by scanning into the test field.
- The system detects whether input came from a **hardware scanner** or manual keyboard based on keystroke timing.
- Scan log shows the last 10 scans with timestamps and source detection.

### Display
- **Enable Customer Display**: Launch a second-screen display for customers.
- **Select Monitor**: Choose which connected monitor shows the customer display.
- **Full Screen Mode**: Launch the POS window in full screen at startup.

### Danger Zone
| Action | Warning |
|---|---|
| **Clear All Data** | Deletes all products, orders, and customers but keeps settings. **Cannot be undone.** |
| **Hard Reset** | Completely wipes the local database including settings. App restarts. **Cannot be undone.** |

---

## 14. Customer Display

When enabled, a secondary window opens on a configured monitor showing:
- Current cart items and quantities.
- Running total.
- Store branding / logo.

This is intended for customer-facing screens at the checkout counter.

---

## 15. Barcode Scanner

MWinPOS supports **USB HID barcode scanners** (plug-and-play):
- On the Checkout screen, point the scanner at any product barcode.
- The item is automatically added to the active cart.
- If the barcode is not found, a dialog offers to create a new product with that barcode in Stock management.
- Scanner detection uses **keystroke timing** (< 50ms between characters = scanner input).

---

## 16. Data Sync & Offline Mode

### Online Mode
- Background sync runs automatically every N seconds (configurable).  
- Products, customers, and promotions are pulled **from ERPNext**.
- Completed orders are pushed **to ERPNext** as Sales Invoices.
- If the internet is unavailable, orders are queued locally and synced when connectivity is restored.
- The **sync status indicator** in the header shows live sync state and error count.

### Standalone Mode
- No ERPNext connection required.
- All products, staff, and customers are managed locally.
- Orders are stored locally only; no Sales Invoices are created in ERPNext.

---

## 17. Security & Auto-Lock

- After **N seconds** of inactivity (default 300 = 5 minutes), the screen automatically locks.
- The PIN Login screen is shown to resume.
- Sensitive operations (item removal, entering Settings/Admin, closing the drawer) require a **Manager PIN** approval via an overlay modal.

---

## 18. Troubleshooting

| Problem | Solution |
|---|---|
| **"Invalid Passcode" on first launch** | Use PIN `123456` (default Admin). If it fails, check that the app rebuilt after the recent update. |
| **Products not showing** | Go to Settings → Connectivity → Manual Sync, or check API credentials. |
| **Printer not printing** | Settings → Printers → Detect Printers, then Check Status. Ensure printer is shared on Windows. |
| **Sync errors in header** | Check ERPNext URL and credentials in Settings → Connectivity → Login. |
| **Screen locked unexpectedly** | Enter your 6-digit PIN to unlock. Adjust Auto-Lock Timeout in Settings → Security. |
| **Customer display not opening** | Settings → Display → Detect Screens, select a monitor, then click Launch. |
| **Cannot enter app at all** | Perform a **Hard Reset** from Settings → Danger Zone. On next start, use PIN `123456`. |
| **Order stuck as "unsynced"** | Go to Orders, open the order, and click **Manual Sync**. |

---

*For technical support or to report bugs, contact your system administrator.*
