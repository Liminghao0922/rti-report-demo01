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

export type TimeControlMode = 'historical' | 'realtime';

interface TimeControlState {
    mode: TimeControlMode;
    currentTime: string; // ISO 8601 format
    isPlaying: boolean;
    // Historical mode settings
    startTime: string; // ISO 8601 format
    endTime: string; // ISO 8601 format
    selectedDate: string; // ISO 8601 date format (YYYY-MM-DD)
}

const defaultDate = new Date().toISOString().split('T')[0];
const combineDateTime = (date: string, time: string) => `${date}T${time}`;

const initialState: TimeControlState = {
    mode: 'realtime',
    currentTime: new Date().toISOString(),
    isPlaying: false,
    startTime: combineDateTime(defaultDate, '09:00:00'),
    endTime: combineDateTime(defaultDate, '18:00:00'),
    selectedDate: defaultDate,
};

const timeControlSlice = createSlice({
    name: 'timeControl',
    initialState,
    reducers: {
        setMode: (state, action: PayloadAction<TimeControlMode>) => {
            state.mode = action.payload;
            state.isPlaying = false; // Stop playing when switching modes
        },
        setCurrentTime: (state, action: PayloadAction<string>) => {
            state.currentTime = action.payload;
        },
        setIsPlaying: (state, action: PayloadAction<boolean>) => {
            state.isPlaying = action.payload;
        },
        togglePlayPause: (state) => {
            state.isPlaying = !state.isPlaying;
        },
        setStartTime: (state, action: PayloadAction<string>) => {
            state.startTime = action.payload;
        },
        setEndTime: (state, action: PayloadAction<string>) => {
            state.endTime = action.payload;
        },
        setSelectedDate: (state, action: PayloadAction<string>) => {
            state.selectedDate = action.payload;
        },
        setTimeRange: (
            state,
            action: PayloadAction<{ startTime: string; endTime: string }>
        ) => {
            state.startTime = action.payload.startTime;
            state.endTime = action.payload.endTime;
        },
        resetToRealtime: (state) => {
            state.mode = 'realtime';
            state.isPlaying = false;
            state.currentTime = new Date().toISOString();
        },
    },
});

export const {
    setMode,
    setCurrentTime,
    setIsPlaying,
    togglePlayPause,
    setStartTime,
    setEndTime,
    setSelectedDate,
    setTimeRange,
    resetToRealtime,
} = timeControlSlice.actions;

export default timeControlSlice.reducer;
