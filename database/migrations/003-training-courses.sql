CREATE TABLE IF NOT EXISTS training_catalogue (
  id text PRIMARY KEY CHECK (id = 'main'),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE TABLE IF NOT EXISTS training_courses (
  id uuid PRIMARY KEY,
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  audience text NOT NULL CHECK (length(audience) BETWEEN 1 AND 250),
  duration text NOT NULL CHECK (length(duration) BETWEEN 1 AND 120),
  format text NOT NULL CHECK (length(format) BETWEEN 1 AND 120),
  summary text NOT NULL DEFAULT '' CHECK (length(summary) <= 500),
  outline text NOT NULL CHECK (length(outline) BETWEEN 1 AND 4000),
  is_placeholder boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS training_courses_public ON training_courses(status, sort_order, id);

-- Seed only the owner-supplied topics, once. Reopening never overwrites staff edits.
WITH initial_catalogue AS (
  INSERT INTO training_catalogue(id) VALUES ('main')
  ON CONFLICT (id) DO NOTHING RETURNING id
)
INSERT INTO training_courses(id,title,audience,duration,format,summary,outline,is_placeholder,status,sort_order)
SELECT courses.* FROM initial_catalogue CROSS JOIN (VALUES
  ('b2c6124a-28d0-4a13-ae7a-bf9183a09801'::uuid,
   'Vibe Coding', 'Teams building applications with AI', 'To be confirmed', 'To be confirmed',
   'Turn an idea into an application with AI coding tools.',
   'Use AI coding tools to turn an idea into an application. Iterate on the result and check that it does what you intended.',
   false, 'published', 0),
  ('b2c6124a-28d0-4a13-ae7a-bf9183a09802'::uuid,
   'Workflow Automation & AI Agents for Daily Work', 'Teams working on repeatable daily tasks', 'To be confirmed', 'To be confirmed',
   'Move beyond one-off manual prompting with repeatable workflows and AI agents.',
   'Turn repeated daily tasks into repeatable workflows using AI agents. Review their outputs and handle exceptions as part of the workflow.',
   false, 'published', 1)
) AS courses(id,title,audience,duration,format,summary,outline,is_placeholder,status,sort_order);
