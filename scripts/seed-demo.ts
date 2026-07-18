import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

import { createClient } from "@supabase/supabase-js";
import * as crypto from "crypto";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// Data Generators
// ============================================================================

const DEMO_ORG_NAME = "Lotus Healthcare B.V.";
const DEMO_ORG_EMAIL = "demo@lotushealthcare.nl";

const dutchFirstNames = [
  "Jan",
  "Peter",
  "Pieter",
  "Paul",
  "Thomas",
  "Marc",
  "Johan",
  "Bert",
  "Ruud",
  "Kees",
  "Henk",
  "Wouter",
  "Dirk",
  "Bas",
  "Erik",
  "Robert",
  "Michael",
  "David",
  "Frank",
  "Gerard",
  "Maria",
  "Anna",
  "Petra",
  "Lisa",
  "Sandra",
  "Barbara",
  "Marieke",
  "Anouk",
  "Ellen",
  "Ingrid",
  "Simone",
  "Nicole",
  "Jolanda",
  "Monique",
  "Wilma",
  "Greet",
  "Martine",
  "Francine",
  "Jacqueline",
  "Christien",
];

const dutchLastNames = [
  "Jansen",
  "Peeters",
  "Vermeulen",
  "Hermans",
  "van den Berg",
  "de Vries",
  "van Dijk",
  "Müller",
  "Schmitz",
  "Hansen",
  "Larsen",
  "Andersen",
  "Nielsen",
  "Thomsen",
  "Petersen",
  "Jensen",
  "Koopmans",
  "Bakker",
  "Bosmans",
  "Brouwers",
  "Cools",
  "Dekker",
  "de Graaf",
  "de Groot",
  "Dijkstra",
  "Doorn",
  "Dorst",
  "Duiveman",
  "Eendracht",
  "van Eeten",
  "Engels",
  "Engeman",
  "Evers",
  "Eyk",
  "Eykman",
  "de Feber",
  "Feddema",
  "Feenstra",
  "Felten",
  "Feringa",
];

const cities = [
  "Amsterdam",
  "Rotterdam",
  "Utrecht",
  "Eindhoven",
  "Den Haag",
  "Groningen",
  "Haarlem",
  "Arnhem",
];
const branches = ["Amsterdam", "Rotterdam", "Utrecht", "Eindhoven"];

const employeeRoles = ["Registered Nurse", "Caregiver", "Physiotherapist", "Domestic Helper"];

const insuranceProviders = [
  "Ziekenhuisverzekeraar XL",
  "Vektis",
  "Menzis",
  "Aetna",
  "Zorgverzekering Plus",
  "Nationale Ned Zorg",
  "Premium Care Insurance",
];

const riskLevels = ["Low", "Medium", "High"];
const careStatuses = ["active", "paused", "completed", "on_hold"];

function generateDutchPhone(): string {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000000) + 1000000;
  return `+31 ${areaCode} ${number}`;
}

function generatePostalCode(): string {
  const digits = Math.floor(Math.random() * 9000) + 1000;
  const letters =
    String.fromCharCode(Math.floor(Math.random() * 26) + 65) +
    String.fromCharCode(Math.floor(Math.random() * 26) + 65);
  return `${digits} ${letters}`;
}

function generateDOB(minAge = 25, maxAge = 85): string {
  const now = new Date();
  const minDate = new Date(now.getFullYear() - maxAge, now.getMonth(), now.getDate());
  const maxDate = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());
  const timestamp = minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime());
  return new Date(timestamp).toISOString().split("T")[0];
}

function generateEmploymentDate(yearsBack = 5): string {
  const now = new Date();
  const startDate = new Date(now.getFullYear() - yearsBack, 0, 1);
  const timestamp = startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime());
  return new Date(timestamp).toISOString().split("T")[0];
}

function randomName(): { first: string; last: string } {
  return {
    first: dutchFirstNames[Math.floor(Math.random() * dutchFirstNames.length)],
    last: dutchLastNames[Math.floor(Math.random() * dutchLastNames.length)],
  };
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateUUID(): string {
  return crypto.randomUUID();
}

// ============================================================================
// Seed Data
// ============================================================================

async function seedDemoData() {
  console.log("🌱 Starting ThuisZorgHub demo data seeding...\n");

  try {
    // Step 1: Clean existing demo data
    console.log("📋 Step 1/11: Checking for existing demo data...");
    const existingOrg = await supabase
      .from("organizations")
      .select("id")
      .eq("name", DEMO_ORG_NAME)
      .single();

    if (existingOrg.data) {
      console.log("🧹 Found existing demo data, cleaning up...");
      const orgId = existingOrg.data.id;

      // Delete in reverse dependency order
      await supabase.from("visit_executions").delete().eq("organization_id", orgId);
      await supabase.from("visit_medication_records").delete().eq("organization_id", orgId);
      await supabase.from("visit_notes").delete().eq("organization_id", orgId);
      await supabase.from("visit_task_completions").delete().eq("organization_id", orgId);
      await supabase.from("visit_history").delete().eq("organization_id", orgId);
      await supabase.from("scheduled_visits").delete().eq("organization_id", orgId);
      await supabase.from("visit_conflicts").delete().eq("organization_id", orgId);
      await supabase.from("visit_recurrence").delete().eq("organization_id", orgId);

      await supabase.from("invoice_payments").delete().eq("organization_id", orgId);
      await supabase.from("invoice_items").delete().eq("organization_id", orgId);
      await supabase.from("invoice_status_history").delete().eq("organization_id", orgId);
      await supabase.from("invoices").delete().eq("organization_id", orgId);
      await supabase.from("timesheets").delete().eq("organization_id", orgId);

      await supabase.from("care_plan_documents").delete().eq("organization_id", orgId);
      await supabase.from("care_plan_goals").delete().eq("organization_id", orgId);
      await supabase.from("care_plan_tasks").delete().eq("organization_id", orgId);
      await supabase.from("care_plan_reviews").delete().eq("organization_id", orgId);
      await supabase.from("care_plan_history").delete().eq("organization_id", orgId);
      await supabase.from("care_plans").delete().eq("organization_id", orgId);

      await supabase.from("employee_client_assignments").delete().eq("organization_id", orgId);
      await supabase.from("employee_availability").delete().eq("organization_id", orgId);
      await supabase.from("employee_unavailability").delete().eq("organization_id", orgId);
      await supabase.from("employees").delete().eq("organization_id", orgId);

      await supabase.from("client_addresses").delete().eq("organization_id", orgId);
      await supabase.from("client_insurance").delete().eq("organization_id", orgId);
      await supabase.from("clients").delete().eq("organization_id", orgId);

      await supabase.from("notifications").delete().eq("organization_id", orgId);
      await supabase.from("audit_logs").delete().eq("organization_id", orgId);
      await supabase.from("report_audit_logs").delete().eq("organization_id", orgId);
      await supabase.from("branches").delete().eq("organization_id", orgId);
      await supabase.from("users").delete().eq("organization_id", orgId);

      // Delete organization last
      await supabase.from("organizations").delete().eq("id", orgId);

      console.log("✅ Cleaned up existing demo data\n");
    }

    // Step 2: Create Organization
    console.log("📋 Step 2/11: Creating organization...");
    const orgId = generateUUID();
    await supabase.from("organizations").insert({
      id: orgId,
      name: DEMO_ORG_NAME,
      legal_name: "Lotus Healthcare B.V.",
      kvk_number: "12345678",
      vat_number: "NL123456789B01",
      email: DEMO_ORG_EMAIL,
      phone: "+31 20 1234567",
      website: "https://lotushealthcare.nl",
      address_line_1: "Keizersgracht 123",
      city: "Amsterdam",
      postal_code: "1015 CJ",
      country: "Netherlands",
      primary_language: "nl",
      timezone: "Europe/Amsterdam",
      currency: "EUR",
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    console.log("✅ Organization created\n");

    // Step 3: Create Branches
    console.log("📋 Step 3/11: Creating branches...");
    const branchIds: Record<string, string> = {};
    for (const branchName of branches) {
      const branchId = generateUUID();
      branchIds[branchName] = branchId;
      await supabase.from("branches").insert({
        id: branchId,
        organization_id: orgId,
        name: `${branchName} Branch`,
        address_line_1: `Businesspark ${branchName} 1`,
        city: branchName,
        postal_code: generatePostalCode(),
        country: "Netherlands",
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    console.log(`✅ Created ${branches.length} branches\n`);

    // Step 4: Create Roles and Users
    console.log("📋 Step 4/11: Creating roles and users...");

    // Create roles
    const roleIds: Record<string, string> = {};
    const roleNames = ["super_admin", "admin", "manager", "coordinator", "employee", "view_only"];

    for (const roleName of roleNames) {
      const roleId = generateUUID();
      roleIds[roleName] = roleId;
      await supabase.from("roles").insert({
        id: roleId,
        organization_id: orgId,
        name: roleName,
        permissions: getPermissionsForRole(roleName),
        is_built_in: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Create users (1 super admin, 2 org admins, 3 managers, 4 coordinators)
    const userIds: Record<string, string> = {};
    const users = [
      { name: "Admin Demo", email: "admin@lotushealthcare.nl", role: "admin", count: 1 },
      { name: "Admin", email: "admin2@lotushealthcare.nl", role: "admin", count: 1 },
      { name: "Manager", email: "manager@lotushealthcare.nl", role: "manager", count: 3 },
      {
        name: "Coordinator",
        email: "coordinator@lotushealthcare.nl",
        role: "coordinator",
        count: 4,
      },
    ];

    for (const userTemplate of users) {
      for (let i = 0; i < userTemplate.count; i++) {
        const userId = generateUUID();
        const email = i === 0 ? userTemplate.email : userTemplate.email.replace("@", `+${i}@`);

        userIds[email] = userId;

        await supabase.from("users").insert({
          id: userId,
          organization_id: orgId,
          email: email,
          full_name: `${userTemplate.name}${i > 0 ? ` ${i}` : ""}`,
          role_id: roleIds[userTemplate.role],
          branch_id: Object.values(branchIds)[i % Object.values(branchIds).length],
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
    console.log(`✅ Created roles and 10 users\n`);

    // Step 5: Create Employees
    console.log("📋 Step 5/11: Creating 40 employees...");
    const employeeIds: string[] = [];

    for (let i = 0; i < 40; i++) {
      const employeeId = generateUUID();
      employeeIds.push(employeeId);

      const name = randomName();
      const role = randomElement(employeeRoles);
      const branchId = randomElement(Object.values(branchIds));

      const hourlyRate =
        role === "Registered Nurse"
          ? 35
          : role === "Physiotherapist"
            ? 40
            : role === "Caregiver"
              ? 18
              : 15;

      await supabase.from("employees").insert({
        id: employeeId,
        organization_id: orgId,
        branch_id: branchId,
        first_name: name.first,
        last_name: name.last,
        email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}${i}@lotushealthcare.nl`,
        phone: generateDutchPhone(),
        address_line_1: `Straat ${randomRange(1, 200)}`,
        postal_code: generatePostalCode(),
        city: randomElement(cities),
        country: "Netherlands",
        employment_type: randomElement(["full_time", "part_time", "contract"]),
        job_title: role,
        hourly_rate: hourlyRate,
        employment_date: generateEmploymentDate(),
        qualifications: getQualificationsForRole(role),
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    console.log(`✅ Created ${employeeIds.length} employees\n`);

    // Step 6: Create Clients
    console.log("📋 Step 6/11: Creating 120 clients...");
    const clientIds: string[] = [];
    const clientData: { id: string; name: string }[] = [];

    for (let i = 0; i < 120; i++) {
      const clientId = generateUUID();
      clientIds.push(clientId);

      const name = randomName();
      clientData.push({ id: clientId, name: `${name.first} ${name.last}` });

      const branchId = randomElement(Object.values(branchIds));

      await supabase.from("clients").insert({
        id: clientId,
        organization_id: orgId,
        branch_id: branchId,
        first_name: name.first,
        last_name: name.last,
        date_of_birth: generateDOB(65, 95),
        email: `client${i}@example.nl`,
        phone: generateDutchPhone(),
        emergency_contact_name: `${randomName().first} ${randomName().last}`,
        emergency_contact_phone: generateDutchPhone(),
        emergency_contact_relationship: randomElement(["child", "sibling", "spouse", "friend"]),
        municipality: randomElement(cities),
        risk_level: randomElement(riskLevels),
        case_status: randomElement(careStatuses),
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Add client address
      await supabase.from("client_addresses").insert({
        id: generateUUID(),
        client_id: clientId,
        organization_id: orgId,
        address_line_1: `Clientstraat ${randomRange(1, 300)}`,
        postal_code: generatePostalCode(),
        city: randomElement(cities),
        country: "Netherlands",
        is_primary: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Add insurance
      await supabase.from("client_insurance").insert({
        id: generateUUID(),
        client_id: clientId,
        organization_id: orgId,
        provider: randomElement(insuranceProviders),
        policy_number: `POL-${randomRange(100000, 999999)}`,
        start_date: generateEmploymentDate(3),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    console.log(`✅ Created ${clientIds.length} clients with addresses and insurance\n`);

    // Step 7: Create Assignments
    console.log("📋 Step 7/11: Creating employee-client assignments...");
    let assignmentCount = 0;

    for (const employeeId of employeeIds) {
      const assignmentCount_ = randomRange(2, 8);
      const assignedClients = new Set<string>();

      for (let i = 0; i < assignmentCount_; i++) {
        let clientId: string;
        do {
          clientId = randomElement(clientIds);
        } while (assignedClients.has(clientId));
        assignedClients.add(clientId);

        await supabase.from("employee_client_assignments").insert({
          id: generateUUID(),
          organization_id: orgId,
          employee_id: employeeId,
          client_id: clientId,
          assignment_date: generateEmploymentDate(2),
          is_active: Math.random() > 0.1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        assignmentCount++;
      }
    }
    console.log(`✅ Created ${assignmentCount} employee-client assignments\n`);

    // Step 8: Create Care Plans (1 per client)
    console.log("📋 Step 8/11: Creating care plans...");
    const carePlanIds: Record<string, string> = {};

    for (const clientId of clientIds) {
      const carePlanId = generateUUID();
      carePlanIds[clientId] = carePlanId;

      await supabase.from("care_plans").insert({
        id: carePlanId,
        organization_id: orgId,
        client_id: clientId,
        title: `Care Plan for Client ${clientData.find((c) => c.id === clientId)?.name || "Unknown"}`,
        description:
          "Comprehensive care plan including medical needs, daily activities, and support requirements.",
        start_date: generateEmploymentDate(1),
        status: randomElement(careStatuses),
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Add goals to care plan
      for (let i = 0; i < randomRange(2, 5); i++) {
        await supabase.from("care_plan_goals").insert({
          id: generateUUID(),
          care_plan_id: carePlanId,
          organization_id: orgId,
          title: `Goal ${i + 1}`,
          description: "Important care objective for client recovery and wellbeing.",
          status: randomElement(["active", "completed", "pending"]),
          target_date: new Date(new Date().setDate(new Date().getDate() + randomRange(30, 180)))
            .toISOString()
            .split("T")[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Add tasks to care plan
      for (let i = 0; i < randomRange(3, 8); i++) {
        await supabase.from("care_plan_tasks").insert({
          id: generateUUID(),
          care_plan_id: carePlanId,
          organization_id: orgId,
          title: `Task ${i + 1}`,
          description: "Daily care activity or support measure.",
          frequency: randomElement(["daily", "weekly", "twice_weekly"]),
          status: randomElement(["active", "completed", "pending"]),
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
    console.log(`✅ Created ${clientIds.length} care plans with goals and tasks\n`);

    // Step 9: Create Visits
    console.log("📋 Step 9/11: Creating ~600 visits...");
    let visitCount = 0;
    const now = new Date();

    for (const clientId of clientIds) {
      const assignmentCount_ = randomRange(5, 7);

      for (let i = 0; i < assignmentCount_; i++) {
        // Create a mix of past, today, and upcoming visits
        const daysOffset = randomRange(-30, 30);
        const visitDate = new Date(now);
        visitDate.setDate(visitDate.getDate() + daysOffset);

        const visitId = generateUUID();
        const status =
          daysOffset < -1 ? "completed" : daysOffset === 0 ? "in_progress" : "scheduled";

        // If cancelled, override status
        if (Math.random() < 0.05) {
          // 5% chance of being cancelled
          await supabase.from("scheduled_visits").insert({
            id: visitId,
            organization_id: orgId,
            client_id: clientId,
            employee_id: randomElement(employeeIds),
            scheduled_date: visitDate.toISOString().split("T")[0],
            scheduled_start_time: `${randomRange(8, 17)}:${Math.random() > 0.5 ? "00" : "30"}`,
            scheduled_duration_minutes: randomElement([30, 60, 90, 120]),
            visit_type: randomElement(["personal_care", "medication", "therapy", "social"]),
            status: "cancelled",
            priority: randomElement(["routine", "urgent"]),
            notes: "Visit cancelled by client request.",
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          await supabase.from("scheduled_visits").insert({
            id: visitId,
            organization_id: orgId,
            client_id: clientId,
            employee_id: randomElement(employeeIds),
            scheduled_date: visitDate.toISOString().split("T")[0],
            scheduled_start_time: `${randomRange(8, 17)}:${Math.random() > 0.5 ? "00" : "30"}`,
            scheduled_duration_minutes: randomElement([30, 60, 90, 120]),
            visit_type: randomElement(["personal_care", "medication", "therapy", "social"]),
            status: status,
            priority: randomElement(["routine", "urgent"]),
            notes: "Regular scheduled homecare visit.",
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        visitCount++;
      }
    }
    console.log(`✅ Created ${visitCount} visits\n`);

    // Step 10: Create Billing Data
    console.log("📋 Step 10/11: Creating billing data (invoices, timesheets, payments)...");
    let timesheetCount = 0;
    let invoiceCount = 0;
    let paymentCount = 0;

    // Create timesheets for employees
    for (const employeeId of employeeIds.slice(0, 20)) {
      for (let month = 0; month < 3; month++) {
        const timesheetDate = new Date();
        timesheetDate.setMonth(timesheetDate.getMonth() - month);

        await supabase.from("timesheets").insert({
          id: generateUUID(),
          organization_id: orgId,
          employee_id: employeeId,
          period_start: new Date(timesheetDate.getFullYear(), timesheetDate.getMonth(), 1)
            .toISOString()
            .split("T")[0],
          period_end: new Date(timesheetDate.getFullYear(), timesheetDate.getMonth() + 1, 0)
            .toISOString()
            .split("T")[0],
          total_hours: randomRange(120, 180),
          status: randomElement(["submitted", "approved", "paid"]),
          notes: "Monthly timesheet entry.",
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        timesheetCount++;
      }
    }

    // Create invoices
    for (let i = 0; i < 30; i++) {
      const invoiceId = generateUUID();
      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - randomRange(0, 60));

      const subtotal = randomRange(1000, 5000);
      const vatAmount = Math.round(subtotal * 0.21);
      const totalAmount = subtotal + vatAmount;

      const status =
        Math.random() < 0.3
          ? "draft"
          : Math.random() < 0.5
            ? "sent"
            : Math.random() < 0.7
              ? "paid"
              : Math.random() < 0.9
                ? "partially_paid"
                : "overdue";

      await supabase.from("invoices").insert({
        id: invoiceId,
        organization_id: orgId,
        invoice_number: `INV-${String(i + 1).padStart(5, "0")}`,
        client_id: randomElement(clientIds),
        branch_id: randomElement(Object.values(branchIds)),
        invoice_date: invoiceDate.toISOString().split("T")[0],
        due_date: new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        period_start: invoiceDate.toISOString().split("T")[0],
        period_end: new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        subtotal: subtotal,
        vat_amount: vatAmount,
        vat_percentage: 21,
        total_amount: totalAmount,
        paid_amount:
          status === "paid"
            ? totalAmount
            : status === "partially_paid"
              ? Math.round(totalAmount * 0.5)
              : 0,
        remaining_balance:
          status === "paid"
            ? 0
            : status === "partially_paid"
              ? Math.round(totalAmount * 0.5)
              : totalAmount,
        status: status,
        notes: "Invoice for homecare services.",
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      invoiceCount++;
    }

    // Create payments
    for (let i = 0; i < 20; i++) {
      const paymentDate = new Date();
      paymentDate.setDate(paymentDate.getDate() - randomRange(0, 30));

      await supabase.from("payments").insert({
        id: generateUUID(),
        organization_id: orgId,
        invoice_id: randomElement(clientIds),
        amount: randomRange(1000, 5000),
        payment_date: paymentDate.toISOString().split("T")[0],
        payment_method: randomElement(["bank_transfer", "check", "cash", "card"]),
        reference_number: `PAY-${randomRange(10000, 99999)}`,
        notes: "Payment received for invoice.",
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      paymentCount++;
    }
    console.log(
      `✅ Created billing data: ${timesheetCount} timesheets, ${invoiceCount} invoices, ${paymentCount} payments\n`
    );

    // Step 11: Create Audit Logs and Notifications
    console.log("📋 Step 11/11: Creating audit logs and notifications...");
    let auditCount = 0;
    let notificationCount = 0;

    // Create audit logs
    const auditActions = ["created", "updated", "deleted", "viewed", "exported"];
    const entityTypes = ["client", "employee", "visit", "invoice", "care_plan", "document"];

    for (let i = 0; i < 100; i++) {
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - randomRange(0, 30));

      await supabase.from("audit_logs").insert({
        id: generateUUID(),
        organization_id: orgId,
        user_id: randomElement(Object.values(userIds)),
        entity_type: randomElement(entityTypes),
        entity_id: randomElement([...clientIds, ...employeeIds]).slice(0, 36),
        action: randomElement(auditActions),
        changes: { modified_fields: ["status", "notes"] },
        ip_address: `192.168.1.${randomRange(1, 254)}`,
        user_agent: "Mozilla/5.0 Demo",
        is_deleted: false,
        created_at: timestamp.toISOString(),
        updated_at: timestamp.toISOString(),
      });
      auditCount++;
    }

    // Create notifications
    for (let i = 0; i < 50; i++) {
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - randomRange(0, 7));

      const notificationTypes = [
        "visit_assigned",
        "visit_reminder",
        "document_uploaded",
        "invoice_sent",
        "payment_received",
        "care_plan_updated",
      ];

      await supabase.from("notifications").insert({
        id: generateUUID(),
        organization_id: orgId,
        user_id: randomElement(Object.values(userIds)),
        title: `${randomElement(notificationTypes)} notification`,
        message: "Important update regarding your assignments or documents.",
        type: randomElement(notificationTypes),
        related_entity_type: randomElement(entityTypes),
        related_entity_id: randomElement([...clientIds, ...employeeIds]).slice(0, 36),
        is_read: Math.random() > 0.3,
        is_deleted: false,
        created_at: timestamp.toISOString(),
        updated_at: timestamp.toISOString(),
      });
      notificationCount++;
    }
    console.log(`✅ Created ${auditCount} audit logs and ${notificationCount} notifications\n`);

    console.log("✨ Demo data seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   • Organization: ${DEMO_ORG_NAME}`);
    console.log(`   • Branches: ${branches.length}`);
    console.log(`   • Users: 10`);
    console.log(`   • Employees: ${employeeIds.length}`);
    console.log(`   • Clients: ${clientIds.length}`);
    console.log(`   • Assignments: ${assignmentCount}`);
    console.log(`   • Visits: ${visitCount}`);
    console.log(`   • Care Plans: ${clientIds.length}`);
    console.log(`   • Timesheets: ${timesheetCount}`);
    console.log(`   • Invoices: ${invoiceCount}`);
    console.log(`   • Payments: ${paymentCount}`);
    console.log(`   • Audit Logs: ${auditCount}`);
    console.log(`   • Notifications: ${notificationCount}`);
    console.log("\n🎯 You can now log in with:");
    console.log("   Email: admin@lotushealthcare.nl");
    console.log("   Password: (as configured during registration)\n");
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    process.exit(1);
  }
}

function getPermissionsForRole(roleName: string): Record<string, boolean> {
  const allPermissions: Record<string, boolean> = {
    "users:read": true,
    "users:write": false,
    "clients:read": true,
    "clients:write": false,
    "employees:read": true,
    "employees:write": false,
    "visits:read": true,
    "visits:write": false,
    "billing:read": true,
    "billing:write": false,
    "reports:read": true,
    "reports:write": false,
    "care_plans:read": true,
    "care_plans:write": false,
    "documents:read": true,
    "documents:write": false,
    "settings:read": false,
    "settings:write": false,
  };

  switch (roleName) {
    case "super_admin":
      return Object.fromEntries(Object.entries(allPermissions).map(([k]) => [k, true]));
    case "admin":
      return {
        ...allPermissions,
        "users:read": true,
        "users:write": true,
        "clients:read": true,
        "clients:write": true,
        "employees:read": true,
        "employees:write": true,
        "billing:read": true,
        "billing:write": true,
        "care_plans:read": true,
        "care_plans:write": true,
        "settings:read": true,
      };
    case "manager":
      return {
        ...allPermissions,
        "clients:read": true,
        "clients:write": true,
        "employees:read": true,
        "employees:write": true,
        "visits:read": true,
        "visits:write": true,
        "reports:read": true,
        "care_plans:read": true,
      };
    case "coordinator":
      return {
        ...allPermissions,
        "clients:read": true,
        "employees:read": true,
        "visits:read": true,
        "visits:write": true,
        "reports:read": true,
      };
    default:
      return allPermissions;
  }
}

function getQualificationsForRole(role: string): string[] {
  const qualifications: Record<string, string[]> = {
    "Registered Nurse": ["Registered Nurse (RN)", "BScN", "CPR Certified"],
    Caregiver: ["Caregiver Certification", "First Aid", "Patient Care"],
    Physiotherapist: ["PT License", "Manual Therapy", "Rehabilitation"],
    "Domestic Helper": ["Domestic Care", "Cleaning", "Safety Awareness"],
  };
  return qualifications[role] || [];
}

// Run seeding
seedDemoData();
