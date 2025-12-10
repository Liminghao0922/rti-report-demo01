/*
 * SPDX-FileCopyrightText: Copyright (c) 2024 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the initial state where server is the property
interface AppStreamState {
    server: string;
    remoteStream: {
        signalingserver: string;
        signalingport: number;
        mediaserver: string;
        mediaport: number;
        accessToken: string;
        sessionid: string;
    };
    kitState: 'unknown' | 'responsive';
}

const initialState: AppStreamState = {
    server: import.meta.env.VITE_STREAMING_SERVER || process.env.STREAMING_SERVER || '',
    remoteStream: {
        signalingserver: '',
        signalingport: 0,
        mediaserver: '',
        mediaport: 0,
        accessToken: '',
        sessionid: '',
    },
    kitState: 'unknown',
};

// Create the slice
const appStreamSlice = createSlice({
    name: 'appstream',
    initialState,
    reducers: {
        // Action to set the server value
        setServer: (state, action: PayloadAction<string>) => {
            state.server = action.payload;
        },
        setRemoteStream: (state, action: PayloadAction<{
            signalingserver: string;
            signalingport: number;
            mediaserver: string;
            mediaport: number;
            accessToken: string;
            sessionid: string;
        }>) => {
            state.remoteStream = {
                signalingserver: action.payload.signalingserver,
                signalingport: action.payload.signalingport,
                mediaserver: action.payload.mediaserver,
                mediaport: action.payload.mediaport,
                accessToken: action.payload.accessToken,
                sessionid: action.payload.sessionid,
            }
        },
        setKitState: (state, action: PayloadAction<'unknown' | 'responsive'>) => {
            state.kitState = action.payload;
        },
    },
});

// Export the action to set the server and the reducer
export const { setServer } = appStreamSlice.actions;
export const { setRemoteStream } = appStreamSlice.actions;
export const { setKitState } = appStreamSlice.actions;
export default appStreamSlice.reducer;
