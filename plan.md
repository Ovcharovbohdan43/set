Full Prompt: Desktop Personal Finance Application Specification (Markdown Version)
Title:

Complete Technical Specification & Development Plan for a Modern Windows Desktop Personal Finance Application

1. Overview

You are an expert full-stack engineer, software architect, and UI/UX specialist.
Your task is to fully design and specify a modern Windows desktop personal finance application.

The application must help users:

Plan budgets (weekly / monthly / yearly)

Track expenses and categorize purchases

Set financial goals and track savings progress

View interactive visual financial reports (charts & diagrams)

Add scheduled expenses and reminders

Receive Windows notifications about bills & payments

Analyze spending and weekly/monthly limits

Use a modern, elegant, high-performance UI

Work offline using a local database

Optionally sync to cloud storage

A single full-stack developer will implement both frontend and backend.

Your output must be exhaustive, highly detailed, and technically correct.

2. Requirements for Your Response

You must produce:

✔ A complete application architecture (frontend, backend, storage, sync, notifications)

✔ Recommended technology stack, explaining trade-offs

✔ Detailed data model (SQL schema + ORM models)

✔ List of Tauri commands or API endpoints with examples

✔ Full UI/UX system description (components, pages, flows, styling)

✔ Detailed charts & reports module specification

✔ Notification system description (Windows toasts + in-app notifications)

✔ Security and privacy guidelines

✔ Installer/packaging plan (MSIX)

✔ CI/CD pipeline (GitHub Actions)

✔ A complete 10-week step-by-step implementation roadmap

✔ Code snippets where helpful (TypeScript, SQL, Rust, C# pseudocode allowed)

✔ Folder structure for the project

✔ Examples of tests (unit and E2E)

Write everything with strict clarity, using Markdown formatting: titles, subsections, numbered lists, bullets, code blocks, tables.

3. Recommended Technology Stack (Primary Option)

The main recommended stack must be:

Frontend

Tauri as the desktop host (fast, secure, minimal footprint)

React + TypeScript + Vite

Tailwind CSS

Radix UI (headless UI primitives)

Framer Motion for animations

Charts & Visualizations

ECharts (preferred)

Alternative options: Chart.js or ApexCharts

Local Database

SQLite (with SQLCipher encryption)

ORM recommended: Prisma (or better-sqlite3 for performance-first builds)

Backend Logic

TypeScript services running inside Tauri backend

Background workers for reminders & scheduled transactions

Cloud Sync (optional)

Node.js backend using Fastify or NestJS

PostgreSQL for remote storage

JWT auth + encrypted payloads

Notifications

Native Windows Toast Notifications via Tauri plugin or WinRT bridge

Installer

MSIX packaging

Digital signing for SmartScreen compliance

4. High-Level System Architecture

Your output must include a complete description of the architecture below:

UI (React) 
   ↕
Tauri Frontend Bridge
   ↕
Business Services (TS)
   ↕
SQLite (Encrypted)
   ↕
Sync Engine (Optional)
   ↔
Cloud API (REST/GraphQL)


Components to describe:

UI Layer

Command Layer (Tauri commands)

Business Logic Services

Database Layer

Sync Layer

Background Scheduler

Notification System

Export/Import System

Security Layer

5. Detailed Data Model

You must output:

SQL schema for SQLite

Prisma schema (if Prisma is chosen)

Explanation of all fields

Reasoning behind indexes

Relationships between models

Example tables (to refine & expand):

user
account
category
transaction
budget
goal
reminder


Include indexing strategy and optimization considerations.

6. API / Command Specification

Provide:

REST endpoint examples

GraphQL schema (optional)

Tauri commands in TypeScript or Rust with usage examples

Example commands:

addTransaction

getMonthlyReport

createBudget

scheduleReminder

syncUpload / syncDownload

7. UI / UX Specification

You must output:

7.1 Pages

Dashboard

Transactions

Budgets

Goals

Reports

Reminders

Settings

7.2 Components

Navigation sidebar

Top app bar

Cards

Tables

Modals

Financial progress bars

Budget indicators

Goal widgets

Interactive charts

7.3 Interaction Rules

Hotkeys

Drag & drop category reorder

Inline editing

Smooth animations

Light/Dark mode

7.4 Style System

Tailwind design tokens

Border radiuses (2xl)

Spacing system

Typography scale

8. Reports & Analytics Module

Output:

Types of charts

Data sources

Aggregation logic

Example ECharts configuration

Export (PNG/PDF/CSV)

Reports required:

Spending by category

Monthly trend line

Income vs expenses

Budget progress

Goal progress

Forecasted spending (simple regression)

9. Reminder & Notification System

Explain:

Background scheduler design

RRULE or cron-based recurring reminder system

Toast notification actions (Pay / Snooze / Open)

In-app notification center

Sync with cloud reminders

10. Security & Privacy Design

Must include:

SQLite encryption (SQLCipher)

Secret key storage in Windows Credential Manager

Optional end-to-end encryption for sync

Secure local storage locations

Data export/import verification

Telemetry opt-in only

11. Packaging & Deployment

Explain how to:

Build the Tauri app

Package it as MSIX

Sign it

Publish updates

Handle auto-updates

Prepare a Windows-ready installer

12. CI/CD

Provide a complete GitHub Actions configuration including:

Linting

TypeScript type-check

Unit tests (Vitest)

Integration tests (Playwright or Tauri test)

Build + sign Windows MSIX

Create GitHub Release

13. Folder Structure

You must output a full multi-level folder layout like:

/src  
  /ui  
  /components  
  /features  
  /services  
  /db  
  /reports  
/src-tauri  
  commands.rs  
  Cargo.toml
/prisma
  schema.prisma
/tests
  e2e
  unit


Also include description for each folder.

14. Testing

Produce:

Unit test examples

Integration test examples

E2E flows (add transaction → update budget → see chart update)

Testing types:

Business logic

Database access

UI components

Notification flows

Sync system tests

15. 10-Week Development Roadmap

Provide a milestone plan such as:

Week 1

Project setup

Tauri + React skeleton

DB initialization

Week 2

Transactions CRUD

Quick-add modal

Week 3

Dashboard widgets

Week 4

Budgets system

Week 5

Goals & savings logic

Week 6

Reminders + notifications

Week 7

Reports module

Week 8

Settings + Data export/import

Week 9

Packaging (MSIX) + Signing

Week 10

Testing, optimizations, beta release

Each week must include acceptance criteria.

16. Execution Criteria (What makes your answer “correct”)

Your answer is only correct if:

It is written entirely in English.

It uses Markdown with clear sections and subsections.

It contains all architecture, schemas, flows, and explanations.

It includes both high-level and low-level technical detail.

It presents a complete, structured plan with milestones.

It is exhaustive and could be handed directly to a full-stack engineer.

It is technically sound and internally consistent.

It includes examples of code blocks and schemas.

It defines clear acceptance criteria for deliverables.

It contains recommendations and justifications for each chosen technology.
