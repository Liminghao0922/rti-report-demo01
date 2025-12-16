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

import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import { RootState } from '../state/store';
import {
    setMode,
    setCurrentTime,
    setIsPlaying,
    setSelectedDate,
    setStartTime,
    setEndTime,
    TimeControlMode,
} from '../state/slice/timeControlSlice';
import './TimeControlComponent.css';

const TimeControlComponent: React.FC = () => {
    const dispatch = useDispatch();
    const {
        mode,
        currentTime,
        isPlaying,
        startTime,
        endTime,
        selectedDate,
    } = useSelector((state: RootState) => state.timeControl);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const currentTimeRef = useRef<string>(currentTime);
    const isPlayingRef = useRef<boolean>(isPlaying);

    const [localStartTime, setLocalStartTime] = useState<string>(() => startTime.split('T')[1]?.substring(0, 8) || '09:00:00');
    const [localEndTime, setLocalEndTime] = useState<string>(() => endTime.split('T')[1]?.substring(0, 8) || '18:00:00');

    // Session start time for Realtime mode
    const [sessionStart] = useState<string>(() => new Date().toISOString());

    // Draggable state
    const [position, setPosition] = useState({ x: 20, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.current.x,
                    y: e.clientY - dragOffset.current.y
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    // Keep refs in sync with store
    useEffect(() => {
        currentTimeRef.current = currentTime;
    }, [currentTime]);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    useEffect(() => {
        setLocalStartTime(startTime.split('T')[1]?.substring(0, 8) || '09:00:00');
    }, [startTime]);

    useEffect(() => {
        setLocalEndTime(endTime.split('T')[1]?.substring(0, 8) || '18:00:00');
    }, [endTime]);

    // Format ISO 8601 datetime for display
    // const formatDateTime = (isoString: string): string => {
    //     return new Date(isoString).toLocaleString('en-US', {
    //         year: 'numeric',
    //         month: '2-digit',
    //         day: '2-digit',
    //         hour: '2-digit',
    //         minute: '2-digit',
    //         second: '2-digit',
    //         hour12: false,
    //     });
    // };

    // Format time for time input (HH:mm:ss)
    const formatTimeForInput = (isoString: string): string => {
        return new Date(isoString).toTimeString().split(' ')[0];
    };

    // Combine date and time into ISO 8601 string
    const combineDateTime = (date: string, time: string): string => {
        return `${date}T${time}`;
    };

    // Calculate progress percentage for historical mode
    const calculateProgress = (): number => {
        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();
        const current = new Date(currentTime).getTime();

        if (end <= start) return 0;
        const progress = ((current - start) / (end - start)) * 100;
        return Math.max(0, Math.min(100, progress));
    };

    const hasValidRange = new Date(endTime).getTime() > new Date(startTime).getTime();

    // Handle progress bar change
    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const percentage = parseFloat(e.target.value);
        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();
        const newTime = start + (end - start) * (percentage / 100);
        dispatch(setCurrentTime(new Date(newTime).toISOString()));
        dispatch(setIsPlaying(false));
    };

    // Ensure start/end in historical mode reflect current date/time inputs
    const ensureHistoricalRange = () => {
        const date = selectedDate || new Date().toISOString().split('T')[0];
        const start = combineDateTime(date, localStartTime);
        const end = combineDateTime(date, localEndTime);
        dispatch(setStartTime(start));
        dispatch(setEndTime(end));
        return { start, end };
    };

    // Handle mode switch
    const handleModeChange = (newMode: TimeControlMode) => {
        // Stop any running intervals first
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        dispatch(setMode(newMode));

        if (newMode === 'realtime') {
            dispatch(setCurrentTime(new Date().toISOString()));
            dispatch(setIsPlaying(true));
        } else {
            const { start } = ensureHistoricalRange();
            dispatch(setCurrentTime(start));
            dispatch(setIsPlaying(false));
        }
    };

    // Handle date change
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        dispatch(setSelectedDate(newDate));

        const newStart = combineDateTime(newDate, localStartTime);
        const newEnd = combineDateTime(newDate, localEndTime);

        dispatch(setStartTime(newStart));
        dispatch(setEndTime(newEnd));
        dispatch(setCurrentTime(newStart));
        dispatch(setIsPlaying(false));
    };

    // Handle start time picker change
    const handleStartTimePickerChange = (value: string | null) => {
        if (!value) return;
        // Ensure we have seconds
        const timeValue = value.length === 5 ? `${value}:00` : value;
        setLocalStartTime(timeValue);
        const newStart = combineDateTime(selectedDate, timeValue);
        dispatch(setStartTime(newStart));
        dispatch(setCurrentTime(newStart));
        dispatch(setIsPlaying(false));
    };

    // Handle end time picker change
    const handleEndTimePickerChange = (value: string | null) => {
        if (!value) return;
        // Ensure we have seconds
        const timeValue = value.length === 5 ? `${value}:00` : value;
        setLocalEndTime(timeValue);
        const newEnd = combineDateTime(selectedDate, timeValue);
        dispatch(setEndTime(newEnd));
        dispatch(setIsPlaying(false));
    };

    // Toggle play/pause
    const handlePlayPause = () => {
        // Guard against invalid range
        if (mode === 'historical' && !hasValidRange) {
            dispatch(setIsPlaying(false));
            return;
        }

        dispatch(setIsPlaying(!isPlaying));
    };

    // Realtime mode: Update time every second
    useEffect(() => {
        if (mode === 'realtime') {
            // Initialize realtime range
            dispatch(setStartTime(sessionStart));
            const now = new Date().toISOString();
            dispatch(setEndTime(now));
            
            // If initially playing, snap to now
            if (isPlaying) {
                dispatch(setCurrentTime(now));
            }

            intervalRef.current = setInterval(() => {
                const currentNow = new Date().toISOString();
                dispatch(setEndTime(currentNow));
                if (isPlayingRef.current) {
                    dispatch(setCurrentTime(currentNow));
                }
            }, 1000);
        }

        return () => {
            if (mode === 'realtime' && intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [mode, dispatch, sessionStart]); // Removed isPlaying to prevent interval reset

    // Handle "Go Live" snap
    useEffect(() => {
        if (mode === 'realtime' && isPlaying) {
             const now = new Date().toISOString();
             dispatch(setCurrentTime(now));
             dispatch(setEndTime(now));
        }
    }, [mode, isPlaying, dispatch]);

    // Historical mode: Auto-play functionality
    useEffect(() => {
        if (mode === 'historical' && isPlaying && hasValidRange) {
            const end = new Date(endTime).getTime();

            intervalRef.current = setInterval(() => {
                const now = new Date(currentTimeRef.current).getTime();
                const next = now + 1000; // advance by 1s

                if (next >= end) {
                    currentTimeRef.current = new Date(end).toISOString();
                    dispatch(setCurrentTime(currentTimeRef.current));
                    dispatch(setIsPlaying(false));
                } else {
                    currentTimeRef.current = new Date(next).toISOString();
                    dispatch(setCurrentTime(currentTimeRef.current));
                }
            }, 1000);
        }

        return () => {
            if (mode === 'historical' && intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [mode, isPlaying, endTime, hasValidRange, dispatch]);

    return (
        <div 
            className="time-control-container"
            style={{ 
                left: `${position.x}px`, 
                top: `${position.y}px` 
            }}
        >
            <div 
                className="time-control-header"
                onMouseDown={handleMouseDown}
                title="Drag to move"
            >
                <h3 className="time-control-title">Time Control</h3>
                <div className="mode-switcher" onMouseDown={(e) => e.stopPropagation()}>
                    <button
                        className={`mode-button ${mode === 'historical' ? 'active' : ''}`}
                        onClick={() => handleModeChange('historical')}
                    >
                        Historical
                    </button>
                    <button
                        className={`mode-button ${mode === 'realtime' ? 'active' : ''}`}
                        onClick={() => handleModeChange('realtime')}
                    >
                        Realtime
                    </button>
                </div>
            </div>

            <div className="time-control-content">
                <div className="historical-controls">
                    {mode === 'historical' && (
                        <>
                            <div className="date-picker-group">
                                <label className="date-picker-label">Date</label>
                                <input
                                    type="date"
                                    className="date-picker-input"
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                />
                            </div>

                            <div className="time-range-group">
                                <div className="time-input-group">
                                    <label className="time-input-label">Start Time</label>
                                    <TimePicker
                                        onChange={handleStartTimePickerChange}
                                        value={localStartTime}
                                        format="HH:mm:ss"
                                        disableClock={true}
                                        clearIcon={null}
                                        className="time-picker-custom"
                                    />
                                </div>
                                <div className="time-input-group">
                                    <label className="time-input-label">End Time</label>
                                    <TimePicker
                                        onChange={handleEndTimePickerChange}
                                        value={localEndTime}
                                        format="HH:mm:ss"
                                        disableClock={true}
                                        clearIcon={null}
                                        className="time-picker-custom"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="progress-bar-container">
                        <div className="progress-bar-wrapper">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="0.1"
                                value={calculateProgress()}
                                onChange={handleProgressChange}
                                className="progress-bar"
                                disabled={(!isPlaying && mode === 'historical') ? false : (mode === 'realtime' ? false : isPlaying || !hasValidRange)}
                            />
                        </div>
                        <div className="progress-bar-labels">
                            <span>{formatTimeForInput(startTime)}</span>
                            <span>{formatTimeForInput(currentTime)}</span>
                            <span>{formatTimeForInput(endTime)}</span>
                        </div>
                        {!hasValidRange && (
                            <div style={{ color: '#d9534f', fontSize: '12px' }}>
                                End time must be later than start time.
                            </div>
                        )}
                    </div>

                    <div className="playback-controls">
                        <button
                            className={`control-button ${isPlaying ? 'pause-button' : 'play-button'}`}
                            onClick={handlePlayPause}
                        >
                            {isPlaying ? (mode === 'realtime' ? '⏸ Pause Live' : '⏸ Pause') : (mode === 'realtime' ? '▶ Go Live' : '▶ Play')}
                        </button>
                        <button
                            className="control-button"
                            onClick={() => {
                                dispatch(setCurrentTime(startTime));
                                dispatch(setIsPlaying(false));
                            }}
                            disabled={isPlaying}
                        >
                            ⏮ Reset to Start
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeControlComponent;
