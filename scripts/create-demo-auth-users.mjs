const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const ADMIN_BASE = `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/admin/users`;
const DEMO_PASSWORD = "ChangeMe123!";

const demoUsers = [
  { email: "admin@cofund.test", fullName: "CoFund Admin", role: "admin" },
  { email: "founder1@cofund.test", fullName: "Amara Okonkwo", role: "founder" },
  { email: "founder2@cofund.test", fullName: "Kemi Adebayo", role: "founder" },
  { email: "founder3@cofund.test", fullName: "Nana Mensah", role: "founder" },
  { email: "investor1@cofund.test", fullName: "David Mensah", role: "investor" },
  { email: "investor2@cofund.test", fullName: "Zainab Bello", role: "investor" },
  { email: "investor3@cofund.test", fullName: "Sade Akin", role: "investor" },
  { email: "mentor1@cofund.test", fullName: "Ngozi Eze", role: "mentor" },
];

async function request(path, options = {}) {
  const response = await fetch(`${ADMIN_BASE}${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  const body = text ? safeJson(text) : null;

  if (!response.ok) {
    throw new Error(`Auth admin request failed (${response.status}): ${text}`);
  }

  return body;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function listUsers() {
  const all = [];
  let page = 1;

  while (true) {
    const data = await request(`?page=${page}&per_page=1000`, { method: "GET" });
    const users = data?.users ?? [];
    all.push(...users);
    if (users.length < 1000) break;
    page += 1;
  }

  return all;
}

async function createUser(user) {
  return request("", {
    method: "POST",
    body: JSON.stringify({
      email: user.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: user.fullName,
        role: user.role,
      },
    }),
  });
}

async function updateUser(id, user) {
  return request(`/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      email: user.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: user.fullName,
        role: user.role,
      },
    }),
  });
}

async function main() {
  const users = await listUsers();
  const existing = new Map(users.map((user) => [user.email, user]));

  for (const user of demoUsers) {
    const current = existing.get(user.email);
    if (current) {
      await updateUser(current.id, user);
      console.log(`Updated ${user.email}`);
    } else {
      await createUser(user);
      console.log(`Created ${user.email}`);
    }
  }

  console.log("");
  console.log("Demo Auth users are ready.");
  console.log(`Password for all demo users: ${DEMO_PASSWORD}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
