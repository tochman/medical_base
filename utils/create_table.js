import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL; // Use environment variable
const supabaseKey = process.env.SUPABASE_KEY; // Use environment variable

const supabase = createClient(supabaseUrl, supabaseKey);

const createTableSql = `
create table classifications (
  id uuid primary key,
  content text,
  metadata jsonb,
  embedding vector (1536)
);
`;

const createFunctionSql = `
create function match_classifications (
  query_embedding vector (1536),
  filter jsonb default '{}'
) returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
) language plpgsql as $$
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (classifications.embedding <=> query_embedding) as similarity
  from classifications
  where metadata @> filter
  order by classifications.embedding <=> query_embedding;
end;
$$;
`;

async function createTableAndFunction() {
  try {
    await supabase.rpc('sql', { sql: createTableSql });
    await supabase.rpc('sql', { sql: createFunctionSql });
    console.log('Table and function created successfully');
  } catch (error) {
    console.error('Error creating table/function:', error);
  }
}

createTableAndFunction();

