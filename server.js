import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const app = new Hono();

app.use("*", cors());

function supabaseFromEnv() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false },
    }
  );
}

// Optional API landing route
app.get("/api", (c) => c.html("<p>Danh sách mentor</p>"));

// GET all mentors
app.get("/api/mentors", async (c) => {
  const supabase = supabaseFromEnv();

  const { data, error } = await supabase.from("mentors_info").select("*");

  if (error) return c.json({ error: error.message }, 500);

  return c.json(data);
});

// GET single mentor by mentor_id
app.get("/api/mentors/:mentor_id", async (c) => {
  const supabase = supabaseFromEnv();
  const mentor_id = c.req.param("mentor_id");
  const email = `${mentor_id}@fpt.com`;

  const { data, error } = await supabase
    .from("mentors_info")
    .select("*")
    .eq("fpt_email", email)
    .maybeSingle();

  if (error) return c.json({ error: error.message }, 500);
  if (!data) return c.body(null, 404);

  return c.json(data);
});

// POST create mentees
app.post("/api/mentees", async (c) => {
  const supabase = supabaseFromEnv();
  const body = await c.req.json();

  const { mentee_name, mentee_email, mentee_branch_name, registrations } = body;

  if (!mentee_name || !mentee_email) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  if (!Array.isArray(registrations) || registrations.length === 0) {
    return c.json({ error: "registrations is required" }, 400);
  }

  const rows = registrations.map((item) => ({
    mentee_name,
    mentee_email,
    mentee_branch_name,
    field: item.field,
    mentor_id: item.mentor_id,
  }));

  const { data, error } = await supabase
    .from("mentee_info")
    .insert(rows)
    .select();

  if (error) return c.json({ error: error.message }, 500);

  return c.json(data, 201);
});

// INFO page
app.get("/api/info", async (c) => {
  const supabase = supabaseFromEnv();

  const { count: count_mentor, error: mentorError } = await supabase
    .from("mentors_info")
    .select("*", { count: "exact", head: true });

  const { count: count_mentee, error: menteeError } = await supabase
    .from("mentee_info")
    .select("*", { count: "exact", head: true });

  if (mentorError) return c.json({ error: mentorError.message }, 500);
  if (menteeError) return c.json({ error: menteeError.message }, 500);

  return c.html(
    `server chứa thông tin của ${count_mentor} mentor và ${count_mentee} mentee`
  );
});

export default app;