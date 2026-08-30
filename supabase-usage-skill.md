Supabase Database Patterns
Patterns for working with Supabase databases including Auth, Row Level Security, table relationships, and query best practices.

Overview
MCP Tools: Query and explore database structure
Authentication: User management, sessions, auth tables
Row Level Security: Policy patterns for data access control
Table Relationships: Foreign keys, joins, nested queries
Query Patterns: Filtering, pagination, performance
MCP Tools
Available tools for database exploration:

mcp__supabase__list_tables - List all tables in the database
mcp__supabase__get_table_schema - Get schema for a specific table
mcp__supabase__execute_sql - Run read-only SQL queries
Workflow:

Start with list_tables to understand database structure
Use get_table_schema to inspect columns and types
Use execute_sql for custom queries (read-only)
Best Practices
DO
✓ Enable RLS on all public tables
✓ Use (select auth.uid()) in RLS policies for performance
✓ Add indexes on RLS-checked columns
✓ Specify roles with TO authenticated in policies
✓ Use on delete cascade for foreign keys to auth.users
✓ Use cursor-based pagination for large datasets
✓ Select only needed columns: .select('id, name') not .select('*')
DON'T
✗ Store sensitive data without RLS
✗ Use auth.uid() directly in policies (use (select auth.uid()))
✗ Create policies without specifying roles
✗ Forget indexes on frequently filtered columns
✗ Use offset pagination for deep pages (>1000 rows)
✗ Expose auth.users directly via API (use public profiles table)
Quick Reference
Common Filters
Filter	JavaScript	Python
Equals	.eq('col', val)	.eq("col", val)
Not equals	.neq('col', val)	.neq("col", val)
Greater than	.gt('col', val)	.gt("col", val)
Greater or equal	.gte('col', val)	.gte("col", val)
Less than	.lt('col', val)	.lt("col", val)
Less or equal	.lte('col', val)	.lte("col", val)
Pattern match	.ilike('col', '%val%')	.ilike("col", "%val%")
In list	.in('col', [a,b])	.in_("col", [a,b])
Is null	.is('col', null)	.is_("col", "null")
OR	.or('a.eq.1,b.eq.2')	.or_("a.eq.1,b.eq.2")
Auth Tables Quick Reference
Table	Key Columns
auth.users	id, email, phone, created_at, last_sign_in_at, raw_user_meta_data
auth.sessions	id, user_id, created_at, updated_at
auth.identities	id, user_id, provider, identity_data
RLS Policy Template
create policy "policy_name" on table_name
to authenticated  -- or anon, or specific role
for select        -- select, insert, update, delete, or all
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );  -- for insert/update
Additional Resources
For detailed patterns and code examples, consult:

references/auth.md - Authentication with JS/Python SDK, user profiles
references/rls.md - Row Level Security policies and performance tips
references/relationships.md - Table relationships and nested queries
references/query-patterns.md - Filtering, pagination, counting, indexes
Referenced Files
The following files are referenced in this skill and included for context.

references/auth.md
# Supabase Authentication

Supabase Auth provides user management with JWT-based sessions.

## Auth Tables

Key tables in the `auth` schema:

- `auth.users` - User accounts (id, email, phone, created_at, etc.)
- `auth.sessions` - Active sessions
- `auth.identities` - OAuth provider identities

## JavaScript SDK

```javascript
// Initialize client
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(url, anonKey);

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "securepassword",
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "securepassword",
});

// Get current user
const {
  data: { user },
} = await supabase.auth.getUser();

// Sign out
await supabase.auth.signOut();

// Listen to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth event:", event);
  if (session) console.log("User ID:", session.user.id);
});

// OAuth sign in
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
});
Python SDK
from supabase import Client, create_client

supabase: Client = create_client(url, key)

# Sign up
response = supabase.auth.sign_up({"email": "user@example.com", "password": "securepassword"})

# Sign in
response = supabase.auth.sign_in_with_password({"email": "user@example.com", "password": "securepassword"})

# Get current user
user = supabase.auth.get_user()

# Sign out
supabase.auth.sign_out()
User Profile Table Pattern
Link a public profile table to auth.users:

create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  first_name text,
  last_name text,
  avatar_url text,
  primary key (id)
);

alter table public.profiles enable row level security;

-- Auto-create profile on signup (trigger)
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

### references/rls.md

```markdown
# Row Level Security (RLS)

RLS controls data access at the row level based on the authenticated user.

## Enabling RLS

```sql
alter table public.posts enable row level security;
Policy Types
Operation	Clause	Purpose
SELECT	using	Filter which rows can be read
INSERT	with check	Validate new rows
UPDATE	using + with check	Filter + validate
DELETE	using	Filter which rows can be deleted
Common Policy Patterns
1. User owns row:

create policy "Users can view own data" on profiles
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Users can update own data" on profiles
to authenticated
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );
2. Public read, owner write:

create policy "Public read" on posts
for select using (true);

create policy "Owner can modify" on posts
for all to authenticated
using ( (select auth.uid()) = author_id );
3. Team/organization access:

create policy "Team members can view" on documents
to authenticated
using (
  team_id in (
    select team_id from team_members
    where user_id = (select auth.uid())
  )
);
4. Role-based access:

create policy "Admins can do anything" on posts
to authenticated
using (
  exists (
    select 1 from users
    where id = (select auth.uid()) and role = 'admin'
  )
);
RLS Performance Tips
Always use (select auth.uid()) instead of auth.uid():

-- SLOW (recalculates per row)
using ( auth.uid() = user_id )

-- FAST (calculates once, 99%+ improvement)
using ( (select auth.uid()) = user_id )
Add indexes on RLS columns:

create index idx_posts_user_id on posts using btree (user_id);
create index idx_documents_team_id on documents using btree (team_id);
Specify roles with TO:

-- Good: policy only applies to authenticated users
create policy "..." on posts to authenticated using (...);

-- Bad: policy applies to all roles including anon
create policy "..." on posts using (...);
Viewing Policies
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where tablename = 'your_table';

### references/relationships.md

```markdown
# Table Relationships

## Foreign Key Setup

```sql
-- One-to-many: user has many posts
create table posts (
  id serial primary key,
  user_id uuid references auth.users on delete cascade,
  title text,
  content text
);

-- Many-to-many: posts have many tags
create table tags (
  id serial primary key,
  name text unique
);

create table post_tags (
  post_id int references posts on delete cascade,
  tag_id int references tags on delete cascade,
  primary key (post_id, tag_id)
);
Querying Relationships (JavaScript)
Supabase auto-detects relationships from foreign keys:

// One-to-many: get posts with author
const { data: posts } = await supabase.from("posts").select(`
    id, title, content,
    author:users!user_id(id, email, full_name)
  `);

// Nested relations: posts with author and comments
const { data: posts } = await supabase.from("posts").select(`
    id, title,
    author:users!user_id(id, email),
    comments(id, content, user:users(email))
  `);

// Many-to-many: posts with tags
const { data: posts } = await supabase.from("posts").select(`
    id, title,
    tags:post_tags(tag:tags(name))
  `);

// Specify foreign key with !hint when ambiguous
const { data } = await supabase.from("messages").select(`
    sender:users!sender_id(name),
    receiver:users!receiver_id(name)
  `);
Querying Relationships (Python)
# One-to-many with nested select
response = supabase.table("posts").select("id, title, author:users!user_id(id, email)").execute()

# Multiple nested relations
response = supabase.table("posts").select("id, title, comments(id, content, user:users(email))").execute()

# Many-to-many through junction table
response = supabase.table("posts").select("id, title, tags:post_tags(tag:tags(name))").execute()

### references/query-patterns.md

```markdown
# Query Patterns

## Filtering

**JavaScript:**

```javascript
// Equality
const { data } = await supabase
  .from("users")
  .select("*")
  .eq("status", "active");

// Comparison
const { data } = await supabase
  .from("users")
  .select("*")
  .gte("age", 18)
  .lt("age", 65);

// Pattern matching
const { data } = await supabase
  .from("users")
  .select("*")
  .ilike("name", "%john%");

// IN operator
const { data } = await supabase
  .from("users")
  .select("*")
  .in("role", ["admin", "moderator"]);

// OR conditions
const { data } = await supabase
  .from("posts")
  .select("*")
  .or("status.eq.featured,priority.gte.5");

// NOT
const { data } = await supabase
  .from("users")
  .select("*")
  .not("status", "eq", "banned");

// NULL check
const { data } = await supabase
  .from("users")
  .select("*")
  .is("deleted_at", null);

// Array contains
const { data } = await supabase
  .from("posts")
  .select("*")
  .contains("tags", ["javascript"]);

// Full-text search
const { data } = await supabase
  .from("posts")
  .select("*")
  .textSearch("content", "supabase & database");
Python:

# Equality
response = supabase.table("users").select("*").eq("status", "active").execute()

# Comparison
response = supabase.table("users").select("*").gte("age", 18).lt("age", 65).execute()

# Pattern matching (case-insensitive)
response = supabase.table("users").select("*").ilike("name", "%john%").execute()

# IN operator
response = supabase.table("users").select("*").in_("role", ["admin", "moderator"]).execute()

# OR conditions
response = supabase.table("posts").select("*").or_("status.eq.featured,priority.gte.5").execute()

# NOT
response = supabase.table("users").select("*").neq("status", "banned").execute()

# NULL check
response = supabase.table("users").select("*").is_("deleted_at", "null").execute()
Pagination
Offset-based (simple, less efficient for large datasets):

// JavaScript
const { data } = await supabase
  .from("posts")
  .select("*")
  .order("created_at", { ascending: false })
  .range(0, 9); // rows 0-9 (first 10)

// Next page
const { data } = await supabase
  .from("posts")
  .select("*")
  .order("created_at", { ascending: false })
  .range(10, 19);
# Python
response = supabase.table("posts").select("*").order("created_at", desc=True).range(0, 9).execute()
Cursor-based (efficient for large datasets):

// JavaScript - use last item's id/timestamp as cursor
const { data } = await supabase
  .from("posts")
  .select("*")
  .order("created_at", { ascending: false })
  .lt("created_at", lastTimestamp)
  .limit(10);
# Python
response = (
    supabase.table("posts")
    .select("*")
    .order("created_at", desc=True)
    .lt("created_at", last_timestamp)
    .limit(10)
    .execute()
)
Counting Rows
// JavaScript - exact count
const { count } = await supabase
  .from("users")
  .select("*", { count: "exact", head: true })
  .eq("status", "active");

console.log(`Active users: ${count}`);
# Python
response = supabase.table("users").select("*", count="exact", head=True).eq("status", "active").execute()

print(f"Active users: {response.count}")
Index Recommendations
Add indexes for frequently filtered/sorted columns:

-- Single column index
create index idx_posts_status on posts (status);

-- Composite index for common filter combinations
create index idx_posts_user_status on posts (user_id, status);

-- Partial index for specific conditions
create index idx_active_posts on posts (created_at) where status = 'active';

-- Use index_advisor for recommendations
select * from index_advisor('SELECT * FROM posts WHERE status = ''active'' ORDER BY created_at');
Query Performance Analysis
-- Analyze query execution plan
explain analyze select * from posts where status = 'active' order by created_at limit 10;
