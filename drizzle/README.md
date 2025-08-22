# Database Migrations

This directory contains clean, organized database migrations for the Retenza loyalty platform.

## Migration Files

### `0001_initial_schema.sql`
- **Purpose**: Creates the complete database schema from scratch
- **Tables**: All core tables with proper relationships and constraints
- **Features**: 
  - User authentication (businesses, customers)
  - Loyalty programs and tiers
  - Missions and campaign management
  - Transaction tracking
  - Push notifications
  - Proper foreign keys and indexes

### `0002_seed_data.sql`
- **Purpose**: Adds sample data for testing and development
- **Data**: Sample businesses, customers, loyalty programs, and missions
- **Usage**: Optional - only run if you want sample data

## How to Use

### Option 1: Clean Reset (Recommended)
```bash
# Completely drop and recreate database
pnpm db:reset-clean

# Or manually
./scripts/reset-database.sh
```

### Option 2: Drizzle Commands
```bash
# Generate new migration
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Push schema changes
pnpm db:push

# Open Drizzle Studio
pnpm db:studio
```

## Database Schema Overview

### Core Tables
- **businesses**: Business user accounts and profiles
- **customers**: Customer user accounts and profiles
- **loyalty_programs**: Business loyalty program configurations
- **missions**: Campaigns and missions for customers
- **mission_registry**: Customer progress tracking
- **transactions**: Customer purchase history
- **reward_redemptions**: Reward usage tracking

### Key Features
- ✅ Proper foreign key constraints
- ✅ Performance indexes
- ✅ JSONB fields for flexible data
- ✅ Timestamp tracking
- ✅ Enum constraints for data integrity

## Notes

- All migrations are designed to be run in order
- The initial schema includes all necessary tables and relationships
- Sample data is optional and can be skipped
- Use `pnpm db:reset-clean` for a completely fresh start 