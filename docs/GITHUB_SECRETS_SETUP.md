# GitHub Secrets Configuration Guide

## Overview

The GitHub Actions workflow requires environment variables to be configured as GitHub Secrets. This guide explains how to set up all required and optional secrets.

## Required Secrets

These secrets are **mandatory** for the application to work:

### 1. Power BI Configuration

#### POWERBI_REPORT_ID
- **Description**: Your Power BI report ID
- **Where to find**: In Power BI Service URL, extract from the path
  ```
  https://app.powerbi.com/groups/.../reports/[THIS_IS_YOUR_ID]/...
  ```

#### POWERBI_EMBED_URL
- **Description**: The embed URL for your report
- **Format**: 
  ```
  https://app.powerbi.com/reportEmbed?reportId=[REPORT_ID]&ctid=[TENANT_ID]
  ```

#### POWERBI_TABLE_NAME
- **Description**: Name of the table in your Power BI dataset used for filtering
- **Example**: `Sales`, `Data`, `Transactions`

#### POWERBI_TABLE_COLUMN_NAME
- **Description**: Name of the column used for region filtering
- **Example**: `Region`, `Territory`, `Area`

#### POWERBI_VISUAL_ID
- **Description**: The visual/slicer ID for filters
- **How to get**: Open report in edit mode → View → Selection Pane → Find slicer name

#### POWERBI_REQUEST_SCOPE
- **Description**: Scope for Power BI API
- **Value**: `https://analysis.windows.net/.default`

### 2. Azure AD / MSAL Configuration

#### MSAL_CONFIG_CLIENT_ID
- **Description**: Azure AD Application (Client) ID
- **Where to find**: Azure Portal → Azure AD → App registrations → Your app → Application ID

#### MSAL_CONFIG_CLIENT_AUTHORITY
- **Description**: Azure AD authority URL
- **Format**: 
  ```
  https://login.microsoftonline.com/[TENANT_ID]
  ```
- **Where to find**: Azure Portal → Azure AD → App registrations → Your app → Directory ID

#### MSAL_CONFIG_REDIRECT_URI
- **Description**: Redirect URI after login
- **For deployment**: Use your Static Web App URL
  ```
  https://your-app-name.azurestaticapps.net
  ```

#### MSAL_CONFIG_POST_LOGOUT_REDIRECT_URI
- **Description**: Redirect URI after logout
- **Same as**: MSAL_CONFIG_REDIRECT_URI

## Optional Secrets

These secrets are **optional** and only needed if you're using Omniverse Streaming or EventHub:

### 3. Omniverse Streaming Configuration

#### SESSION_SERVICE_URL
- **Description**: URL of your Omniverse Streaming server
- **Example**: `https://your-streaming-server.com/`
- **Default placeholder**: `<ovestreamingurl>`
- **Note**: Leave as default if not using Streaming

#### USD_PATH
- **Description**: Path to USD file in Azure Storage
- **Example**: `https://yourstorage.blob.core.windows.net/container/model.usd`

#### USD_SAS_TOKEN
- **Description**: SAS token for accessing USD file
- **How to get**: Azure Portal → Storage Account → SAS token

#### USD_HOST_NAME
- **Description**: Azure Storage account hostname
- **Example**: `yourstorage.blob.core.windows.net`

#### USD_CONTAINER_NAME
- **Description**: Storage container name
- **Example**: `models`, `usd-files`

### 4. EventHub Configuration

#### EVENTHUB_REQUEST_SCOPE
- **Description**: Scope for EventHub API
- **Value**: `https://eventhubs.azure.net/.default`

#### EVENTHUB_RESOURCE_URL
- **Description**: EventHub namespace URL
- **Example**: `my-eventhub.servicebus.windows.net`
- **Default placeholder**: `<eventhubnamespace>.servicebus.windows.net`

#### EVENTHUB_NAME
- **Description**: Name of the Event Hub instance
- **Example**: `my-hub`

#### EVENTHUB_GROUP_NAME
- **Description**: Consumer group name
- **Value**: `$Default` (standard)

## How to Add Secrets to GitHub

### Step 1: Go to Repository Settings

1. Open your GitHub repository
2. Click **Settings** (top navigation)
3. Click **Secrets and variables** in left sidebar
4. Click **Actions**

### Step 2: Add Each Secret

1. Click **New repository secret**
2. Enter the secret name (exactly as shown in this guide)
3. Paste the secret value
4. Click **Add secret**

### Step 3: Repeat for All Secrets

Repeat Step 2 for each secret listed below:

## Complete Secrets Checklist

### Required ✅
- [ ] POWERBI_REPORT_ID
- [ ] POWERBI_EMBED_URL
- [ ] POWERBI_TABLE_NAME
- [ ] POWERBI_TABLE_COLUMN_NAME
- [ ] POWERBI_VISUAL_ID
- [ ] POWERBI_REQUEST_SCOPE
- [ ] MSAL_CONFIG_CLIENT_ID
- [ ] MSAL_CONFIG_CLIENT_AUTHORITY
- [ ] MSAL_CONFIG_REDIRECT_URI
- [ ] MSAL_CONFIG_POST_LOGOUT_REDIRECT_URI
- [ ] AZURE_STATIC_WEB_APPS_API_TOKEN

### Optional (if using Streaming) 🔧
- [ ] SESSION_SERVICE_URL
- [ ] USD_PATH
- [ ] USD_SAS_TOKEN
- [ ] USD_HOST_NAME
- [ ] USD_CONTAINER_NAME

### Optional (if using EventHub) 📡
- [ ] EVENTHUB_REQUEST_SCOPE
- [ ] EVENTHUB_RESOURCE_URL
- [ ] EVENTHUB_NAME
- [ ] EVENTHUB_GROUP_NAME

## Validating Secrets

After adding all secrets, you can verify:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. You should see a list of all added secrets
3. Click **Update** on any secret to view/edit it

**Note**: GitHub masks secret values in logs for security.

## Troubleshooting

### Build Fails: "Process completed with exit code 1"

**Possible causes**:
1. Missing required secrets
2. Incorrect secret values
3. Typo in secret names

**Solution**:
1. Check GitHub Actions logs for specific error messages
2. Verify all required secrets are set
3. Double-check secret names match exactly (case-sensitive)

### Build Succeeds but App Doesn't Work

**Possible causes**:
1. Power BI configuration incorrect
2. Azure AD redirect URI mismatch
3. Permissions not granted in Azure AD

**Solution**:
1. Verify Power BI values in Azure Portal and Power BI Service
2. Update Azure AD Redirect URIs to match Static Web App URL
3. Ensure app has Report.Read.All permission

### How to Debug

1. Go to Actions tab in your GitHub repository
2. Click the failed workflow
3. Click the Build step to see detailed logs
4. Look for specific error messages

## Security Best Practices

1. ✅ **Use GitHub Secrets** - Never hardcode sensitive values in code
2. ✅ **Rotate Secrets** - Periodically update SAS tokens and authentication keys
3. ✅ **Limit Permissions** - Grant only necessary permissions in Azure AD
4. ✅ **Review Logs** - Check deployment logs for any unauthorized access
5. ✅ **Use Azure Key Vault** - For production, consider Azure Key Vault integration

## Updating Secrets

To update a secret:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click the secret you want to update
3. Click **Update**
4. Enter new value
5. Click **Update secret**

The next workflow run will use the updated value.

## Deleting Secrets

To delete a secret:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click the secret you want to delete
3. Click **Delete**
4. Confirm deletion

## Next Steps

After configuring all secrets:

1. Push a change to your repository
2. Go to **Actions** tab
3. Watch the workflow run with your configured secrets
4. Check the deployment URL in the workflow logs

## Support

For issues with:
- **Power BI**: [Power BI Support](https://docs.microsoft.com/power-bi/)
- **Azure AD**: [Azure AD Docs](https://docs.microsoft.com/azure/active-directory/)
- **GitHub Actions**: [GitHub Actions Docs](https://docs.github.com/actions)
