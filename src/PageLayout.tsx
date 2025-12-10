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

import React, { ReactNode } from 'react';
import { AuthenticatedTemplate } from '@azure/msal-react';
import { NavigationBar } from './NavigationBar';
import ServiceComponent from "./components/ServiceComponent";
import AppStreamComponent from './components/AppStreamComponent';
import USDStorageComponent from './components/USDStorageComponent';
import SelectionComponent from "./components/SelectionComponent";
import StatusComponent from "./components/StatusComponent";
import EventHubStreamComponent from "./components/EventHubStreamComponent";
import EmbedPowerBIComponent from "./components/EmbedPowerBIComponent";
import FilterButtonPanel from "./components/FilterButtonPanel";

interface PageLayoutProps {
    children: ReactNode;
}

// Check if streaming is configured
const isStreamingEnabled = () => {
    const streamingServer = import.meta.env.VITE_STREAMING_SERVER || process.env.STREAMING_SERVER;
    return streamingServer && streamingServer.trim() !== '';
};

// Check if EventHub is configured
const isEventHubEnabled = () => {
    const eventhubUrl = import.meta.env.VITE_EVENTHUB_RESOURCE_URL || process.env.EVENTHUB_RESOURCE_URL;
    return eventhubUrl && eventhubUrl !== '<eventhubnamespace>.servicebus.windows.net' && eventhubUrl.trim() !== '';
};

export const PageLayout: React.FC<PageLayoutProps> = (props) => {
    const streamingEnabled = isStreamingEnabled();
    const eventHubEnabled = isEventHubEnabled();

    return (
        <>
            <NavigationBar />
            {props.children}
            <br />
            <AuthenticatedTemplate>
                {/* Show filter buttons when streaming is not enabled */}
                {!streamingEnabled && <FilterButtonPanel/>}
                
                {/* Always show PowerBI Report */}
                <EmbedPowerBIComponent/>
                
                {/* Show fallback background when streaming is not enabled */}
                {!streamingEnabled && (
                    <div className="fallback-background">
                        <img src="/background-placeholder.svg" alt="Background" />
                    </div>
                )}
                
                {/* Optional: EventHub Component */}
                {eventHubEnabled && <EventHubStreamComponent/>}
                
                {/* Optional: Streaming Components */}
                {streamingEnabled && (
                    <>
                        <ServiceComponent/>
                        <AppStreamComponent/>
                        <USDStorageComponent/>
                        <SelectionComponent/>
                    </>
                )}
                
                <StatusComponent/>
            </AuthenticatedTemplate>
        </>
    );
};

