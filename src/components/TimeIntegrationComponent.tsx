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

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import { timeIntegrationService } from '../service/TimeIntegrationService';

/**
 * TimeIntegrationComponent - listens to time control state and syncs to Power BI and Omniverse
 * Headless component: no UI, only side-effects
 */
const TimeIntegrationComponent: React.FC = () => {
    const { mode, currentTime, isPlaying, startTime, endTime } = useSelector(
        (state: RootState) => state.timeControl
    );
    
    const prevModeRef = useRef(mode);
    const prevTimeRef = useRef(currentTime);
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Listen to mode changes
    useEffect(() => {
        if (prevModeRef.current !== mode) {
            console.log(`🔄 Time mode changed to: ${mode}`);
            timeIntegrationService.notifyModeChange(mode);
            
            // On mode switch, sync immediately
            timeIntegrationService.syncTime(currentTime, false);
            
            prevModeRef.current = mode;
        }
    }, [mode, currentTime]);

    // Listen to time changes with debounce for performance
    useEffect(() => {
        // Clear previous timeout
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        // Skip if time unchanged
        if (prevTimeRef.current === currentTime) {
            return;
        }

        // While playing: short debounce; manual changes: immediate
        const delay = isPlaying ? 100 : 0;

        updateTimeoutRef.current = setTimeout(() => {
            console.log(`⏱️ Time changed to: ${currentTime}`);
            timeIntegrationService.syncTime(currentTime, isPlaying);
            prevTimeRef.current = currentTime;
        }, delay);

        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, [currentTime, isPlaying]);

    // Listen to time range changes (historical mode only)
    useEffect(() => {
        if (mode === 'historical') {
            console.log(`📅 Time range set: ${startTime} to ${endTime}`);
            // Optional: apply range filter immediately if desired
            // timeIntegrationService.syncTimeRange(startTime, endTime);
        }
    }, [mode, startTime, endTime]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, []);

    // Headless component returns null
    return null;
};

export default TimeIntegrationComponent;
