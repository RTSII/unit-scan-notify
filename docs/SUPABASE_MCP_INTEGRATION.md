# Supabase MCP Server Integration

This document describes how to integrate the Supabase MCP (Model Context Protocol) Server with your development environment to enable AI assistants to directly query and interact with your Supabase database.

## What is Supabase MCP Server?

The Supabase MCP Server is a Model Context Protocol server that provides AI assistants with direct access to your Supabase database. This enables:

- **Direct Database Queries**: AI can query your database schema and data
- **Schema Inspection**: Automatic understanding of your table structures, relationships, and constraints
- **Real-time Data Access**: AI can fetch current data to provide context-aware assistance
- **Migration Support**: AI can help write and review database migrations
- **RLS Policy Understanding**: AI can analyze and suggest Row Level Security policies

## Prerequisites

- Supabase project with database access
- MCP-compatible AI client (Claude Desktop, Cline, Cursor, etc.)
- Node.js 18+ installed
- Your Supabase connection details

## Installation

### 1. Install the Supabase MCP Server

The Supabase MCP server is typically installed globally or configured in your MCP client settings.

```bash
# Using npx (recommended for testing)
npx @modelcontextprotocol/server-supabase

# Or install globally
npm install -g @modelcontextprotocol/server-supabase
```

### 2. Gather Your Supabase Credentials

You'll need the following from your Supabase project dashboard:

- **Project URL**: `https://fvqojgifgevrwicyhmvj.supabase.co`
- **Service Role Key**: Found in Project Settings → API → service_role key (⚠️ Keep this secret!)
- **Database Connection String**: Found in Project Settings → Database → Connection string

## Configuration

### For Claude Desktop

Add the following to your Claude Desktop configuration file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase",
        "postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
      ]
    }
  }
}
```

### For Cline (VS Code Extension)

Add to your VS Code settings or Cline MCP settings:

```json
{
  "cline.mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase",
        "postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
      ]
    }
  }
}
```

### For Cursor

Add to your Cursor MCP configuration (`.cursor/mcp.json` in your project):

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase",
        "postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
      ]
    }
  }
}
```

## Project-Specific Configuration

### Connection String Format

For this project (SPR Vice City), use the following connection string format:

```
postgres://postgres.fvqojgifgevrwicyhmvj:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

Replace `[YOUR-PASSWORD]` with your actual database password.

### Environment Variables (Recommended)

For better security, use environment variables:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://fvqojgifgevrwicyhmvj.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key-here"
      }
    }
  }
}
```

## Available MCP Tools

Once configured, the AI assistant will have access to these tools:

### 1. `query_database`
Execute SQL queries against your database.

**Example prompts:**
- "Show me all violation forms from this week"
- "What's the schema of the violation_photos table?"
- "Count how many users have the admin role"

### 2. `list_tables`
List all tables in your database.

**Example prompts:**
- "What tables exist in the database?"
- "Show me the database schema"

### 3. `describe_table`
Get detailed information about a specific table.

**Example prompts:**
- "Describe the violation_forms table"
- "What columns does the profiles table have?"
- "Show me the foreign keys for violation_photos"

### 4. `execute_migration`
Run database migrations (use with caution).

**Example prompts:**
- "Create a migration to add an index on unit_number"
- "Add a new column to track violation severity"

## Usage Examples

### Querying Data

```
You: "How many violation forms were created this week?"

AI: [Uses query_database tool]
SELECT COUNT(*) FROM violation_forms 
WHERE created_at >= date_trunc('week', CURRENT_DATE);
```

### Schema Inspection

```
You: "What's the relationship between violation_forms and violation_photos?"

AI: [Uses describe_table tool on both tables]
The violation_photos table has a foreign key constraint 
(violation_photos_violation_id_fkey) that references 
violation_forms(id) with ON DELETE CASCADE.
```

### Migration Assistance

```
You: "Help me create a migration to add a 'priority' field to violation forms"

AI: [Uses schema understanding + migration tools]
Here's a migration that adds a priority enum field...
```

## Security Best Practices

### ⚠️ Critical Security Notes

1. **Never commit your service role key** to version control
2. **Use environment variables** for sensitive credentials
3. **Restrict MCP access** to development environments only
4. **Review AI-generated queries** before execution, especially:
   - DELETE operations
   - UPDATE operations affecting multiple rows
   - Schema changes (ALTER TABLE, DROP TABLE)
   - RLS policy modifications

### Recommended Approach

1. Use a **separate development database** for MCP integration
2. Create a **read-only database user** for safer AI queries
3. Enable **query logging** to monitor AI database access
4. Use **connection pooling** to prevent connection exhaustion

### Read-Only User Setup (Recommended)

Create a read-only user for safer AI interactions:

```sql
-- Create read-only role
CREATE ROLE mcp_readonly;

-- Grant read access to all tables
GRANT USAGE ON SCHEMA public TO mcp_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mcp_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT ON TABLES TO mcp_readonly;

-- Create user with read-only role
CREATE USER mcp_user WITH PASSWORD 'secure-password-here';
GRANT mcp_readonly TO mcp_user;
```

Then use this user's credentials in your MCP configuration.

## Troubleshooting

### Connection Issues

**Problem**: "Failed to connect to database"

**Solutions**:
- Verify your connection string is correct
- Check that your IP is allowed in Supabase dashboard (Database → Settings → Connection pooling)
- Ensure you're using the connection pooler port (6543) not direct connection (5432)
- Verify your password doesn't contain special characters that need URL encoding

### Permission Errors

**Problem**: "Permission denied for table X"

**Solutions**:
- Verify you're using the service role key (not anon key)
- Check RLS policies aren't blocking the query
- Ensure the user has appropriate grants

### MCP Server Not Starting

**Problem**: MCP server fails to initialize

**Solutions**:
- Check Node.js version (18+ required)
- Clear npm cache: `npm cache clean --force`
- Try installing globally: `npm install -g @modelcontextprotocol/server-supabase`
- Check MCP client logs for detailed error messages

### Slow Queries

**Problem**: Database queries timeout or are very slow

**Solutions**:
- Use connection pooler (port 6543) instead of direct connection
- Add indexes to frequently queried columns
- Limit result sets with LIMIT clauses
- Review query execution plans

## Project-Specific Schema Context

### Core Tables

The AI will have access to these tables:

- **`violation_forms`**: Main violation records (bigint id, user_id, unit_number, occurred_at, location, description, status)
- **`violation_photos`**: Normalized photo storage (bigint id, violation_id FK, uploaded_by, storage_path)
- **`profiles`**: User profiles (user_id PK, email, full_name, role)
- **`invites`**: Invitation system (id, email, token, invited_by, expires_at, used_at)
- **`valid_units`**: Unit validation reference (id, unit_number, building, is_active)

### Key Relationships

- `violation_photos.violation_id` → `violation_forms.id` (ON DELETE CASCADE)
- `violation_forms.user_id` → `auth.users.id`
- `profiles.user_id` → `auth.users.id`

### RLS Policies

The AI can help analyze and suggest improvements to:
- Team-wide read access on `violation_forms`
- User-specific write access
- Admin-only delete permissions
- Photo upload restrictions

## Benefits for This Project

With Supabase MCP integration, AI can help with:

1. **Query Optimization**: Analyze slow queries and suggest indexes
2. **Migration Writing**: Generate migrations based on schema changes
3. **Data Analysis**: Quick insights into violation patterns, user activity
4. **Schema Validation**: Verify foreign keys, constraints, and relationships
5. **RLS Policy Review**: Ensure security policies are correctly configured
6. **Test Data Generation**: Create realistic test data for development
7. **Documentation**: Auto-generate schema documentation

## Disabling the Integration

To temporarily disable the Supabase MCP server:

1. Comment out or remove the `supabase` entry from your MCP configuration
2. Restart your MCP client (Claude Desktop, Cline, etc.)

## Additional Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [Supabase MCP Server GitHub](https://github.com/modelcontextprotocol/servers/tree/main/src/supabase)
- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [Claude Desktop MCP Guide](https://docs.anthropic.com/claude/docs/model-context-protocol)

## Support

For issues specific to:
- **MCP Server**: Check the MCP server GitHub issues
- **Supabase Connection**: Verify in Supabase Dashboard → Database → Connection
- **This Project**: See `docs/DATABASE_MANAGEMENT.md` for schema details

---

**Last Updated**: October 11, 2025  
**Status**: Ready for configuration  
**Security Level**: ⚠️ Development only - Use read-only credentials
