# GitHub Actions Workflow Quick Reference

## Workflow Overview

The file `.github/workflows/azure-static-web-app-deploy.yml` automates the build and deployment process to Azure Static Web Apps.

## Workflow Execution Flow

```
1. Code Push/PR Created
         ↓
2. Checkout Code
         ↓
3. Setup Node.js 18
         ↓
4. Install Dependencies (npm ci)
         ↓
5. Run Linter (non-blocking)
         ↓
6. Build Application (with environment variables)
         ↓
7. Deploy to Azure Static Web App
         ↓
8. Report Status
         ↓
9. Cleanup (on PR close)
```

## Trigger Events

The workflow runs automatically on:

### Push Events
- Any push to `main` branch
- Any push to `staging` branch

### Pull Request Events
- PR opened against `main` or `staging`
- PR synchronized (new commits)
- PR reopened
- PR closed (cleanup)

## Build Step - Environment Variables

The **Build application** step now includes environment variables from GitHub Secrets.

### How It Works

```yaml
- name: Build application
  env:
    POWERBI_REPORT_ID: ${{ secrets.POWERBI_REPORT_ID }}
    # ... other secrets
  run: npm run build
```

This means:
1. GitHub retrieves the secret value from your repository secrets
2. Temporarily sets it as an environment variable
3. Passes it to the `npm run build` command
4. The value is masked in logs for security

### Required Secrets

Before deployment, ensure these secrets are set in GitHub:

**Power BI Configuration:**
- POWERBI_REPORT_ID
- POWERBI_EMBED_URL
- POWERBI_TABLE_NAME
- POWERBI_TABLE_COLUMN_NAME
- POWERBI_VISUAL_ID
- POWERBI_REQUEST_SCOPE

**Azure AD Configuration:**
- MSAL_CONFIG_CLIENT_ID
- MSAL_CONFIG_CLIENT_AUTHORITY
- MSAL_CONFIG_REDIRECT_URI
- MSAL_CONFIG_POST_LOGOUT_REDIRECT_URI

**Optional - Streaming:**
- SESSION_SERVICE_URL
- USD_PATH
- USD_SAS_TOKEN
- USD_HOST_NAME
- USD_CONTAINER_NAME

**Optional - EventHub:**
- EVENTHUB_REQUEST_SCOPE
- EVENTHUB_RESOURCE_URL
- EVENTHUB_NAME
- EVENTHUB_GROUP_NAME

**Deployment:**
- AZURE_STATIC_WEB_APPS_API_TOKEN

## Monitoring Workflow Execution

### View Workflow Runs

1. Go to your GitHub repository
2. Click **Actions** tab
3. See list of workflow runs
4. Click any run to see details

### Understanding Workflow Status

| Status | Meaning |
|--------|---------|
| 🟢 Success | Deployment completed successfully |
| 🔴 Failed | Build or deployment failed |
| ⏳ In Progress | Workflow is currently running |
| ⭕ Skipped | Workflow was skipped (e.g., on close PR) |

### Checking Build Logs

1. Click the failed workflow run
2. Click the specific step that failed
3. Expand the step logs to see error details
4. Look for error messages starting with ❌

## Deployment Stages

### Stage 1: Build
- **Time**: ~1-2 minutes
- **What happens**: 
  - Dependencies installed
  - Linter runs (warnings don't block)
  - TypeScript compilation
  - Vite bundling
  - Output in `dist/` directory

### Stage 2: Deploy
- **Time**: ~1-3 minutes
- **What happens**:
  - Upload build artifacts to Azure
  - Create deployment slot
  - Configure environment
  - Activate deployment
  - Generate preview URL

### Stage 3: Cleanup (PR only)
- **Time**: ~30 seconds
- **What happens**:
  - Remove PR preview deployment
  - Clean up resources

## Common Scenarios

### Scenario 1: Push to main
```
1. You push code to main
2. Workflow automatically triggers
3. Code builds and deploys to production
4. Live app updates
```

### Scenario 2: Create Pull Request
```
1. You create PR to main
2. Workflow automatically triggers
3. Code builds and deploys to preview
4. GitHub comment shows preview URL
5. Team reviews live preview
```

### Scenario 3: Update PR
```
1. You push more commits to PR
2. Workflow automatically retriggers
3. Updated preview is deployed
4. Preview URL comment updates
```

### Scenario 4: Close Pull Request
```
1. You close/merge PR
2. Cleanup workflow triggers
3. Preview deployment is removed
4. Resources are freed
```

## Troubleshooting Guide

### Build Failed: "npm ERR!"

**Cause**: Dependency installation or build error

**Solution**:
1. Check the exact error message
2. Run `npm install` locally to reproduce
3. Fix the issue in your code
4. Push again

### Build Failed: "POWERBI_REPORT_ID is undefined"

**Cause**: Missing GitHub secret

**Solution**:
1. Go to Settings → Secrets and variables → Actions
2. Add missing secret
3. Re-run workflow

### Build Succeeded but App Not Working

**Cause**: Incorrect secret values

**Solution**:
1. Verify all secrets in GitHub match actual values
2. Check Power BI and Azure AD configuration
3. Ensure redirect URIs are correct

### Deployment Hangs

**Cause**: Usually resolves itself, but can indicate Azure issues

**Solution**:
1. Wait up to 5 minutes
2. Check Azure Portal for issues
3. Cancel and re-run if still hanging

## Re-running Workflows

### Re-run a Failed Workflow

1. Go to Actions → Failed workflow
2. Click **Re-run jobs**
3. Select which jobs to re-run
4. Confirm

### Run on Demand (Manually)

1. Go to Actions tab
2. Click workflow name on left
3. Click **Run workflow**
4. Select branch
5. Click **Run workflow** button

## Workflow Optimization Tips

### 1. Use Caching
The workflow already caches npm dependencies with `cache: 'npm'`. This speeds up subsequent runs.

### 2. Reduce Secret Count
Consider using fewer, larger secrets if managing many becomes difficult.

### 3. Conditional Steps
Optional steps are controlled with conditions:
```yaml
continue-on-error: true  # Don't fail on linter warnings
```

### 4. Parallel Jobs
Currently all jobs run sequentially. Can be optimized with parallel jobs if needed.

## Security Considerations

1. ✅ **Secrets are masked** - Never printed in logs
2. ✅ **Tokens are temporary** - Only exist during workflow run
3. ✅ **GITHUB_TOKEN is auto-generated** - No manual setup needed
4. ⚠️ **Keep secrets updated** - Rotate regularly
5. ⚠️ **Review workflow logs** - Ensure no sensitive data leaked

## Next Steps

1. ✅ Add all required GitHub Secrets
2. ✅ Update Azure AD redirect URIs
3. ✅ Push code to main or create PR
4. ✅ Watch workflow run in Actions tab
5. ✅ Access live app at deployed URL

## Support Resources

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Azure Static Web Apps Deploy Action](https://github.com/Azure/static-web-apps-deploy)
- [GitHub Secrets Management](https://docs.github.com/actions/security-guides/encrypted-secrets)
