# Military Gear Distribution System

A full-stack **military gear distribution and inventory management system** designed for Taiwan reservist education recall operations.

The system helps personnel check in reservists, manage gear inventory, issue equipment according to predefined allowances, and process returns while maintaining consistent inventory state during concurrent operations.

## Features

* **Reservist Management**

  * Search by name or national ID
  * Check in reservists
  * View reservist information and current gear

* **Gear Distribution**

  * Issue bulk and serialized equipment
  * Enforce per-category gear allowances
  * Track equipment by size and serial number
  * Display current inventory availability

* **Gear Returns**

  * Return bulk equipment by quantity
  * Return serialized equipment individually
  * Track returned equipment condition
  * Automatically update serialized equipment status

* **Inventory & Data Integrity**

  * PostgreSQL transactions for issue/return operations
  * Row-level locking for concurrent inventory operations
  * Prevent duplicate assignment of serialized equipment
  * Deterministic lock ordering to reduce deadlock risk
  * Distribution history and audit records

* **Reliable Frontend**

  * Loading and error states
  * Retry failed requests
  * Automatic refresh after mutations
  * Prevent stale inventory state from being treated as authoritative

## Tech Stack

**Frontend**

* React
* TypeScript
* React Router
* TanStack Query
* Tailwind CSS
* Vitest
* Testing Library
* MSW

**Backend**

* Node.js
* TypeScript
* REST API
* PostgreSQL
* Database transactions & row-level locking

## Architecture

```text
┌──────────────────────┐
│   React + TypeScript │
│      Frontend        │
└──────────┬───────────┘
           │ REST API
           ▼
┌──────────────────────┐
│   Node.js + TypeScript│
│       Backend         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      PostgreSQL      │
│ Inventory & History  │
└──────────────────────┘
```

## Core Workflow

```text
Search Reservist
       ↓
Check In
       ↓
View Gear Status
       ↓
┌──────────────┐
│ Issue / Return│
└───────┬──────┘
        ↓
Validate & Transaction
        ↓
Update Inventory
        ↓
Refresh Latest Gear State
```

## Concurrency Handling

Inventory can be modified by multiple operators at the same time, so the backend does not rely only on application-level validation.

For issue and return operations, the system uses:

* Database transactions
* Row-level locking
* Guarded inventory updates
* Serialized-item locking during issue
* Deterministic lock ordering

This prevents race conditions such as two operators issuing the same serialized equipment or reducing bulk inventory below zero.

## Project Structure

```text
.
├── client/          # React frontend
├── server/          # Node.js backend
└── ...
```

## Getting Started

### Prerequisites

* Node.js
* PostgreSQL
* npm or pnpm

### Installation

```bash
git clone <repository-url>
cd <project-directory>

npm install
```

### Environment Variables

Configure the required environment variables:

```env
DATABASE_URL=postgresql://...
VITE_API_BASE_URL=http://localhost:<server-port>
```

### Run

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

The frontend will display the local development URL after startup.

## Testing

Run the test suite with:

```bash
npm test
```

Frontend tests use **Vitest, Testing Library, and MSW** to verify UI behavior and API interactions without depending on a live backend.

Backend integration tests use PostgreSQL to verify database transactions and inventory behavior.

## Engineering Highlights

This project focuses on demonstrating practical full-stack engineering skills, including:

* Domain-driven inventory design
* REST API development
* Transactional database operations
* Concurrent inventory handling
* Business-rule validation
* Server-state management
* Error and loading state design
* Automated testing

## License

This project is a portfolio project demonstrating full-stack software engineering skills.
