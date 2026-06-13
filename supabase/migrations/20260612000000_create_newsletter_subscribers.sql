create table public.newsletter_subscribers (
  id uuid not null default gen_random_uuid (),
  email text not null,
  created_at timestamp with time zone null default now(),
  constraint newsletter_subscribers_pkey primary key (id),
  constraint newsletter_subscribers_email_key unique (email)
) TABLESPACE pg_default;
