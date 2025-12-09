/*
SPDX-FileCopyrightText: Copyright (c) 2024 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
SPDX-License-Identifier: MIT

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
import { defineConfig,loadEnv } from "vite";
import { viteExternalsPlugin } from 'vite-plugin-externals';
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import react from "@vitejs/plugin-react";

export default ({ mode }) => {
    // Load app-level env vars to node-level env vars.
    const env  = loadEnv(mode, process.cwd(), '');

    return defineConfig({
        plugins: [
            react(),
            viteExternalsPlugin({
                GFN: 'GFN'
            }),
            nodePolyfills()
        ]
        ,
        define: {
            'process.env': {},
            "process.env.MSAL_CONFIG_CLIENT_ID":JSON.stringify(env.MSAL_CONFIG_CLIENT_ID),
            "process.env.MSAL_CONFIG_CLIENT_AUTHORITY":JSON.stringify(env.MSAL_CONFIG_CLIENT_AUTHORITY),
            "process.env.SESSION_SERVICE_URL":JSON.stringify(env.SESSION_SERVICE_URL),
            "process.env.USD_PATH":JSON.stringify(env.USD_PATH),
            "process.env.USD_SAS_TOKEN":JSON.stringify(env.USD_SAS_TOKEN),
            "process.env.USD_HOST_NAME":JSON.stringify(env.USD_HOST_NAME),
            "process.env.USD_CONTAINER_NAME":JSON.stringify(env.USD_CONTAINER_NAME),
            "process.env.POWERBI_REQUEST_SCOPE":JSON.stringify(env.POWERBI_REQUEST_SCOPE),
            "process.env.POWERBI_BASIC_FILTER_SCHEMA":JSON.stringify(env.POWERBI_BASIC_FILTER_SCHEMA),
            "process.env.POWERBI_VISUAL_ID":JSON.stringify(env.POWERBI_VISUAL_ID),
            "process.env.POWERBI_TABLE_NAME":JSON.stringify(env.POWERBI_TABLE_NAME),
            "process.env.POWERBI_TABLE_COLUMN_NAME":JSON.stringify(env.POWERBI_TABLE_COLUMN_NAME),
            "process.env.POWERBI_REPORT_ID":JSON.stringify(env.POWERBI_REPORT_ID),
            "process.env.POWERBI_EMBED_URL":JSON.stringify(env.POWERBI_EMBED_URL),
            "process.env.EVENTHUB_REQUEST_SCOPE":JSON.stringify(env.EVENTHUB_REQUEST_SCOPE),
            "process.env.EVENTHUB_RESOURCE_URL":JSON.stringify(env.EVENTHUB_RESOURCE_URL),
            "process.env.EVENTHUB_NAME":JSON.stringify(env.EVENTHUB_NAME),
            "process.env.EVENTHUB_GROUP_NAME":JSON.stringify(env.EVENTHUB_GROUP_NAME),
            "process.env.MSAL_CONFIG_REDIRECT_URI":JSON.stringify(env.MSAL_CONFIG_REDIRECT_URI),
            "process.env.MSAL_CONFIG_POST_LOGOUT_REDIRECT_URI":JSON.stringify(env.MSAL_CONFIG_POST_LOGOUT_REDIRECT_URI)
        }
    });
}
