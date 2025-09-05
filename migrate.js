#!/usr/bin/env node

/**
 * SPR Vice City - Database Migration Helper
 * 
 * This script helps manage database migrations for the SPR Vice City project.
 * Since we're using a hosted Supabase instance, this provides utilities to:
 * - Generate new migration files
 * - List pending migrations
 * - Show migration SQL for manual application
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'supabase', 'migrations');

function listMigrations() {
  console.log('📋 Available Migrations:');
  console.log('========================');

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('No migrations directory found.');
    return;
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found.');
    return;
  }

  files.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });
}

function showMigration(filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Migration file not found: ${filename}`);
    return;
  }

  console.log(`📄 Migration: ${filename}`);
  console.log('='.repeat(50));
  console.log(fs.readFileSync(filePath, 'utf8'));
  console.log('='.repeat(50));
  console.log('💡 Copy the SQL above and run it in your Supabase Dashboard > SQL Editor');
}

function generateMigrationTemplate(name) {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '_');
  const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
  const filePath = path.join(MIGRATIONS_DIR, filename);

  const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}
-- Description: Add your migration description here

-- Add your SQL statements below:

-- Example:
-- CREATE TABLE IF NOT EXISTS public.example_table (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   name TEXT NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Don't forget to add RLS policies if needed:
-- ALTER TABLE public.example_table ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view their own records" 
-- ON public.example_table 
-- FOR SELECT 
-- USING (auth.uid() = user_id);
`;

  fs.writeFileSync(filePath, template);
  console.log(`✅ Created migration: ${filename}`);
  console.log(`📝 Edit the file: ${filePath}`);
}

// Command line interface
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'list':
    listMigrations();
    break;

  case 'show':
    if (!arg) {
      console.error('❌ Please provide a migration filename');
      console.log('Usage: node migrate.js show <filename>');
      process.exit(1);
    }
    showMigration(arg);
    break;

  case 'new':
    if (!arg) {
      console.error('❌ Please provide a migration name');
      console.log('Usage: node migrate.js new "migration name"');
      process.exit(1);
    }
    generateMigrationTemplate(arg);
    break;

  default:
    console.log('🚀 SPR Vice City - Database Migration Helper');
    console.log('');
    console.log('Available commands:');
    console.log('  list              - List all migration files');
    console.log('  show <filename>   - Show migration SQL content');
    console.log('  new "name"        - Create a new migration template');
    console.log('');
    console.log('Examples:');
    console.log('  node migrate.js list');
    console.log('  node migrate.js show 20250127000003_add_admin_violation_policies.sql');
    console.log('  node migrate.js new "add user preferences table"');
    console.log('');
    console.log('💡 After creating migrations, apply them manually in Supabase Dashboard > SQL Editor');
}