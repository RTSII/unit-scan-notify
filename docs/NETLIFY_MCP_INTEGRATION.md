# Netlify MCP Server Integration

This document describes how to integrate the Netlify MCP (Model Context Protocol) Server with your development environment to enable AI assistants to manage and interact with your Netlify deployments.

## What is Netlify MCP Server?

The Netlify MCP Server is a Model Context Protocol server that provides AI assistants with access to your Netlify account and deployments. This enables:

- **Deployment Management**: AI can check deployment status, trigger builds, and manage sites
- **Site Configuration**: View and update site settings, environment variables, and build configurations
- **Domain Management**: Manage custom domains and DNS settings
- **Build Logs**: Access and analyze build logs for debugging
- **Form Submissions**: View and manage form submissions from Netlify Forms
- **Analytics**: Access site analytics and performance metrics

## Prerequisites

- Active Netlify account
- Netlify personal access token
- MCP-compatible AI client (Claude Desktop, Cline, Cursor, etc.)
- Node.js 18+ installed

## Installation

### 1. Install the Netlify MCP Server

```bash
# Using npx (recommended)
npx @modelcontextprotocol/server-netlify

# Or install globally
npm install -g @modelcontextprotocol/server-netlify
```

### 2. Get Your Netlify Access Token

You'll need a Netlify personal access token. Get it from:
1. Go to Netlify Dashboard → User Settings → Applications
2. Click "New access token"
3. Give it a descriptive name (e.g., "MCP Server Access")
4. Copy the token (starts with `nfp_`)

⚠️ **Keep this token secure!** Never commit it to version control.

## Configuration

### For Claude Desktop

Add the following to your Claude Desktop configuration file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "netlify": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-netlify"],
      "env": {
        "NETLIFY_AUTH_TOKEN": "your-netlify-token-here"
      }
    }
  }
}
```

### For Cline (VS Code Extension)

Add to your VS Code settings or Cline MCP settings:

```json
{
  "cline.mcpServers": {
    "netlify": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-netlify"],
      "env": {
        "NETLIFY_AUTH_TOKEN": "your-netlify-token-here"
      }
    }
  }
}
```

### For Cursor

Add to your Cursor MCP configuration (`.cursor/mcp.json` in your project):

```json
{
  "mcpServers": {
    "netlify": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-netlify"],
      "env": {
        "NETLIFY_AUTH_TOKEN": "your-netlify-token-here"
      }
    }
  }
}
```

## Available MCP Tools

Once configured, the AI assistant will have access to these tools:

### 1. `list_sites`
List all sites in your Netlify account.

**Example prompts:**
- "Show me all my Netlify sites"
- "What sites are deployed on Netlify?"

### 2. `get_site`
Get detailed information about a specific site.

**Example prompts:**
- "Show me details for the SPR Vice City site"
- "What's the deployment status of my main site?"

### 3. `list_deploys`
List deployments for a specific site.

**Example prompts:**
- "Show me recent deployments"
- "What's the status of the latest build?"

### 4. `get_deploy`
Get detailed information about a specific deployment.

**Example prompts:**
- "Show me details for the latest deployment"
- "What went wrong with the last build?"

### 5. `trigger_deploy`
Trigger a new deployment.

**Example prompts:**
- "Deploy the latest changes"
- "Trigger a new build"

### 6. `get_build_logs`
Retrieve build logs for debugging.

**Example prompts:**
- "Show me the build logs for the failed deployment"
- "What errors occurred during the last build?"

### 7. `list_env_vars`
List environment variables for a site.

**Example prompts:**
- "What environment variables are configured?"
- "Show me the env vars for production"

### 8. `update_env_var`
Update environment variables.

**Example prompts:**
- "Update the VITE_SUPABASE_URL environment variable"
- "Add a new API key to the environment"

## Usage Examples

### Checking Deployment Status

```
You: "What's the status of my latest Netlify deployment?"

AI: [Uses list_sites and list_deploys tools]
Your latest deployment to SPR Vice City was successful.
- Deploy ID: 6789abcd
- Status: Ready
- Published at: 2025-10-11 01:30 AM
- URL: https://spr-vice-city.netlify.app
```

### Debugging Build Failures

```
You: "Why did my last build fail?"

AI: [Uses get_deploy and get_build_logs tools]
The build failed due to a TypeScript error in Admin.tsx.
Error: Cannot find name 'ArrowLeftIcon'
Line 316, column 18
```

### Managing Environment Variables

```
You: "What environment variables are set for my site?"

AI: [Uses list_env_vars tool]
Current environment variables:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- NODE_VERSION
```

### Triggering Deployments

```
You: "Deploy the latest changes to production"

AI: [Uses trigger_deploy tool]
Deployment triggered successfully.
- Build ID: abc123
- Status: Building
- You can monitor progress at: https://app.netlify.com/sites/...
```

## Project-Specific Context

### SPR Vice City Deployment

This project is deployed on **Lovable.dev**, but you may also have Netlify deployments for:
- Preview environments
- Testing branches
- Backup deployments

### Common Tasks

1. **Check Build Status**: Verify successful deployments after pushing changes
2. **Debug Build Errors**: Analyze build logs when deployments fail
3. **Manage Environment Variables**: Update Supabase URLs, API keys, etc.
4. **Preview Deployments**: Check preview URLs for pull requests
5. **Rollback**: Revert to previous deployments if needed

## Security Best Practices

### ⚠️ Critical Security Notes

1. **Never commit your access token** to version control
2. **Use environment variables** for the token in MCP configuration
3. **Rotate tokens regularly** for security
4. **Limit token scope** to only necessary permissions
5. **Review AI actions** before confirming, especially:
   - Deployment triggers
   - Environment variable changes
   - Site configuration updates
   - Domain changes

### Token Management

**To rotate your token:**
1. Go to Netlify Dashboard → User Settings → Applications
2. Create a new personal access token
3. Update your MCP configuration with the new token
4. Revoke the old token

### Recommended Permissions

For development use, your token should have:
- ✅ Read access to sites and deployments
- ✅ Trigger builds
- ✅ Manage environment variables
- ⚠️ Limited write access to site settings
- ❌ No billing or team management access

## Troubleshooting

### Authentication Errors

**Problem**: "Invalid authentication token"

**Solutions**:
- Verify the token is correct and not expired
- Check that the token is properly set in the environment variable
- Ensure no extra spaces or quotes around the token
- Try regenerating the token in Netlify dashboard

### Permission Errors

**Problem**: "Insufficient permissions to perform action"

**Solutions**:
- Verify your token has the necessary scopes
- Check that you're the owner or have admin access to the site
- Regenerate token with appropriate permissions

### MCP Server Not Starting

**Problem**: Netlify MCP server fails to initialize

**Solutions**:
- Check Node.js version (18+ required)
- Verify the package is installed: `npm list -g @modelcontextprotocol/server-netlify`
- Try clearing npm cache: `npm cache clean --force`
- Check MCP client logs for detailed error messages

### Rate Limiting

**Problem**: "Rate limit exceeded"

**Solutions**:
- Wait a few minutes before retrying
- Reduce frequency of API calls
- Use caching for frequently accessed data
- Consider upgrading your Netlify plan for higher limits

## Benefits for This Project

With Netlify MCP integration, AI can help with:

1. **Deployment Monitoring**: Track build status and deployment health
2. **Quick Debugging**: Analyze build logs and identify errors
3. **Environment Management**: Update configuration without leaving your IDE
4. **Preview Testing**: Check preview deployments for pull requests
5. **Performance Analysis**: Review site analytics and performance metrics
6. **Rollback Assistance**: Quickly revert to previous working deployments
7. **Documentation**: Auto-generate deployment documentation

## Disabling the Integration

To temporarily disable the Netlify MCP server:

1. Comment out or remove the `netlify` entry from your MCP configuration
2. Restart your MCP client (Claude Desktop, Cline, etc.)

## Alternative: Using Netlify CLI

For direct command-line access, you can also use the Netlify CLI:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Link to your site
netlify link

# Deploy
netlify deploy --prod
```

## Additional Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [Netlify MCP Server GitHub](https://github.com/modelcontextprotocol/servers/tree/main/src/netlify)
- [Netlify API Documentation](https://docs.netlify.com/api/get-started/)
- [Netlify CLI Documentation](https://docs.netlify.com/cli/get-started/)

## Support

For issues specific to:
- **MCP Server**: Check the MCP server GitHub issues
- **Netlify API**: Verify in Netlify Dashboard → API access
- **This Project**: See `docs/DEPLOYMENT_SUMMARY.md` for deployment details

---

**Last Updated**: October 11, 2025  
**Status**: Ready for configuration  
**Security Level**: ⚠️ Keep token secure - Do not commit to version control
