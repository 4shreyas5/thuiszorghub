# ThuisZorgHub Demo Data Seeding System

A production-quality database seeding system for ThuisZorgHub that populates Supabase with realistic Dutch homecare data.

## Overview

The seeding system creates a complete, interconnected demo environment with:

- **1 Organization**: Lotus Healthcare B.V.
- **4 Branches**: Amsterdam, Rotterdam, Utrecht, Eindhoven
- **10 Users**: 1 admin, 2 org admins, 3 managers, 4 coordinators
- **40 Employees**: Mix of nurses, caregivers, physiotherapists, domestic helpers
- **120 Clients**: Realistic profiles with insurance and contact info
- **~310+ Assignments**: Employee-client relationships
- **~600 Visits**: Past, today, and upcoming with various statuses
- **120 Care Plans**: Goals, tasks, and reviews for each client
- **120+ Timesheets**: Monthly employee timesheets
- **30 Invoices**: Various payment statuses (draft, sent, paid, overdue)
- **20 Payments**: Payment records
- **100 Audit Logs**: System activity tracking
- **50 Notifications**: User notifications across all modules

## Installation

### Prerequisites

- Node.js 18+ and npm
- Supabase project with credentials
- Environment variables configured

### Setup

1. Ensure environment variables are set:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

2. Install dependencies:

```bash
npm install
```

## Usage

### Running the Seed Script

Execute the demo data seeding:

```bash
npm run seed
```

### What Happens

The seed script:

1. **Checks for existing demo data** - Detects if demo data was previously seeded
2. **Cleans up** - Removes old demo data if it exists (idempotent)
3. **Creates organization** - Sets up Lotus Healthcare B.V.
4. **Creates branches** - 4 regional offices
5. **Creates users and roles** - Admin, managers, and coordinators
6. **Creates employees** - 40 staff members with realistic details
7. **Creates clients** - 120 clients with addresses and insurance
8. **Creates assignments** - Links employees to clients
9. **Creates care plans** - Care goals and tasks for each client
10. **Creates visits** - ~600 scheduled/completed/cancelled visits
11. **Creates billing data** - Timesheets, invoices, and payments
12. **Creates audit logs & notifications** - System activity records

### Execution Time

- **First run**: 30-45 seconds
- **Subsequent runs**: 25-35 seconds (includes cleanup)
- **Network dependent**: May vary based on Supabase connection

## Generated Data

### Organization

- **Name**: Lotus Healthcare B.V.
- **Email**: demo@lotushealthcare.nl
- **Address**: Amsterdam, Netherlands
- **Currency**: EUR
- **Timezone**: Europe/Amsterdam

### User Credentials

All demo users can log in (set password during registration):

| Email                            | Role        |
| -------------------------------- | ----------- |
| admin@lotushealthcare.nl         | Admin       |
| admin2@lotushealthcare.nl        | Admin       |
| manager@lotushealthcare.nl       | Manager     |
| manager+1@lotushealthcare.nl     | Manager     |
| manager+2@lotushealthcare.nl     | Manager     |
| coordinator@lotushealthcare.nl   | Coordinator |
| coordinator+1@lotushealthcare.nl | Coordinator |
| coordinator+2@lotushealthcare.nl | Coordinator |
| coordinator+3@lotushealthcare.nl | Coordinator |

### Employee Roles

**Distribution across 40 employees:**

- Registered Nurses (~15)
- Caregivers (~15)
- Physiotherapists (~5)
- Domestic Helpers (~5)

**Qualifications vary by role:**

- Nurses: RN, BScN, CPR
- Caregivers: Caregiver cert, First aid
- Physiotherapists: PT license, Manual therapy
- Helpers: Domestic care, Cleaning

### Client Data

**120 realistic Dutch clients with:**

- Dutch names and addresses
- Dates of birth (65-95 years old)
- Emergency contacts
- Municipality assignments
- Risk levels (Low/Medium/High)
- Care status (active/paused/completed/on_hold)
- Insurance providers

### Visits

**~600 total visits distributed:**

- Past visits (completed or cancelled)
- Today's visits (in_progress)
- Future visits (scheduled)
- Duration: 30-120 minutes
- Types: personal_care, medication, therapy, social
- Priority: routine or urgent

### Billing

**Financial data for 3 months:**

- 120+ timesheets (employees working 120-180 hours/month)
- 30 invoices (€1,000-€5,000 each with 21% VAT)
- Varied statuses: draft, sent, paid, overdue, partially_paid
- 20 payment records

### Audit Trail

**100 audit logs showing:**

- User actions (created, updated, deleted, viewed, exported)
- Entity types (client, employee, visit, invoice, care_plan, document)
- Timestamps over last 30 days
- IP addresses and user agents

### Notifications

**50 notifications across:**

- visit_assigned
- visit_reminder
- document_uploaded
- invoice_sent
- payment_received
- care_plan_updated

## Idempotency

The seed script is **fully idempotent**:

```bash
# Safe to run multiple times
npm run seed
npm run seed
npm run seed
```

Each run:

1. Detects existing Lotus Healthcare B.V. organization
2. Removes all associated data
3. Creates fresh demo data
4. **No duplicates** - new data replaces old

## Data Quality

All generated data is realistic:

- **Names**: Common Dutch first and last names
- **Phone numbers**: Dutch format (+31 X XXXX XXXX)
- **Addresses**: Dutch postal codes (XXXX XX format)
- **Dates**: Realistic employment dates and visit schedules
- **Relationships**: Proper foreign key constraints maintained
- **Timestamps**: Chronologically consistent

## Customization

### Modifying Data Volume

Edit `scripts/seed-demo.ts`:

```typescript
// Change number of employees (line ~380)
for (let i = 0; i < 40; i++) {
  // <- Change to desired number
  // ...
}

// Change number of clients (line ~420)
for (let i = 0; i < 120; i++) {
  // <- Change to desired number
  // ...
}

// Change number of visits (line ~520)
const assignmentCount_ = randomRange(5, 7); // <- Visits per client
```

### Modifying Generated Data

```typescript
// Change organization name (line 22)
const DEMO_ORG_NAME = 'Your Company Name';

// Add different employee roles (line 49)
const employeeRoles = [
  'Your Role Here',
  // ...
];

// Adjust hourly rates (line ~410)
const hourlyRate = role === 'Registered Nurse' ? 35 : /* ... */;
```

## Troubleshooting

### Connection Error

```
Missing Supabase credentials
```

**Solution**: Ensure environment variables are set:

```bash
export NEXT_PUBLIC_SUPABASE_URL=your_url
export SUPABASE_SERVICE_ROLE_KEY=your_key
```

### Permission Denied

```
Error: You do not have permission to insert into this table
```

**Solution**: Use `SUPABASE_SERVICE_ROLE_KEY`, not the public API key. Service role key has unrestricted access for admin operations.

### Slow Execution

Script taking longer than expected?

1. Check Supabase network status
2. Verify database resources aren't constrained
3. Reduce data volume (see Customization)
4. Try running during off-peak hours

### Data Not Appearing

1. Verify Supabase project is correct
2. Check organization name wasn't changed mid-seed
3. Look in Supabase admin panel to verify tables populated
4. Check browser console for errors

## Database Schema

The seed script populates these tables:

**Core**

- organizations
- branches
- users
- roles
- permissions

**HR**

- employees
- employee_availability
- employee_unavailability
- employee_client_assignments

**Clients**

- clients
- client_addresses
- client_insurance

**Care Management**

- care_plans
- care_plan_goals
- care_plan_tasks
- care_plan_reviews
- care_plan_history
- care_plan_documents

**Scheduling**

- scheduled_visits
- visit_recurrence
- visit_history
- visit_conflicts
- visit_executions
- visit_notes
- visit_medication_records
- visit_task_completions

**Billing**

- timesheets
- invoices
- invoice_items
- invoice_payments
- invoice_status_history
- payments

**Audit & Communication**

- audit_logs
- report_audit_logs
- notifications
- document_audit_logs
- communication_logs
- email_logs

## Performance Metrics

### Seed Execution Time Breakdown

| Step                    | Duration   | Items                        |
| ----------------------- | ---------- | ---------------------------- |
| Cleanup                 | 2-3s       | Removes old data             |
| Organization & Branches | 1s         | 1 org + 4 branches           |
| Users & Roles           | 2s         | 10 users + 6 roles           |
| Employees               | 5s         | 40 employees                 |
| Clients & Insurance     | 8s         | 120 clients + 240 records    |
| Assignments             | 8s         | ~310 assignments             |
| Care Plans              | 10s        | 120 plans + goals + tasks    |
| Visits                  | 12s        | ~600 visits                  |
| Billing                 | 8s         | 120+ timesheets, 30 invoices |
| Audit & Notifications   | 8s         | 150 records                  |
| **Total**               | **30-45s** | **~2,500 records**           |

## Security Notes

⚠️ **Important**:

- This seed script uses `SUPABASE_SERVICE_ROLE_KEY`
- Never commit service role key to version control
- Only run in development environments
- Use `.env.local` with `*.local` in .gitignore
- Never use demo data in production

## License

Part of ThuisZorgHub SaaS Platform. See main LICENSE file.

## Support

For issues or questions about the seeding system:

1. Check Supabase documentation: https://supabase.com/docs
2. Review error messages in console output
3. Verify environment variables are correctly set
4. Check database connection in Supabase dashboard

## Next Steps After Seeding

1. Log in with `admin@lotushealthcare.nl`
2. Verify data in admin dashboard
3. Test workflows (create visit, record payment, etc.)
4. Customize demo data as needed
5. Run tests against realistic data

---

**Last Updated**: 2024
**Seed Version**: 1.0.0
