/*
 * SPDX-FileCopyrightText: Copyright (c) 2024 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

//import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';
import { powerBIFilterService } from './PowerBIFilterService';
import { setURL } from '../state/slice/usdStorageSlice';
import { store } from '../state/store';

export class TimeIntegrationService {
  private lastSentTime: string | null = null;

  /**
   * Returns true when streaming is configured (Omniverse stream available).
   * When streaming is disabled there is no AppStreamer controller and
   * attempting to send messages will cause
   * "There is no stream controller. Please call the setup method.".
   */
  private isStreamingEnabled(): boolean {
    // Keep logic in sync with PageLayout.isStreamingEnabled
    const streamingServer =
      (import.meta as any).env?.VITE_STREAMING_SERVER ||
      (typeof process !== 'undefined' ? (process as any).env?.STREAMING_SERVER : undefined);

    return !!(streamingServer && typeof streamingServer === 'string' && streamingServer.trim() !== '');
  }

  /**
   * Sync time to Power BI and Omniverse
   * @param currentTime - current time in ISO 8601
   * @param isPlaying - whether playback is running (for optimization)
   */
  async syncTime(currentTime: string, isPlaying: boolean = false): Promise<void> {
    // Throttle: skip if time did not change
    if (this.lastSentTime === currentTime && isPlaying) {
      return;
    }

    this.lastSentTime = currentTime;

    // Update Power BI and Omniverse in parallel
    await Promise.all([
      this.updatePowerBI(currentTime),
      this.updateOmniverse(currentTime),
    ]);
  }

  /**
   * Update Power BI report time filter
   */
  private async updatePowerBI(currentTime: string): Promise<void> {
    try {
      await powerBIFilterService.applyTimeFilter(currentTime);
      console.log(`📊 Power BI updated to time: ${currentTime}`);
    } catch (error) {
      console.error('Failed to update Power BI:', error);
    }
  }

  /**
   * Send time update message to Omniverse/Kit
   */
  private updateOmniverse(currentTime: string): void {
    // If streaming is not configured, skip Omniverse messaging entirely
    if (!this.isStreamingEnabled()) {
      return;
    }

    try {
      // const message = {
      //   event_type: 'timeUpdate',
      //   payload: {
      //     currentTime: currentTime,
      //     timestamp: new Date(currentTime).getTime(),
      //   },
      // };

     // AppStreamer.sendMessage(JSON.stringify(message));
     
      // Logic to switch USD file every 5 seconds based on current time
      const date = new Date(currentTime);
      const seconds = date.getSeconds();
      const index = Math.floor(seconds / 5) % 2;
      
      const usdFiles = [
        '${omni.usd_viewer.samples}/samples_data/stage01.usd',
        '${omni.usd_viewer.samples}/samples_data/stage02.usd'
      ];

      const selectedFile = usdFiles[index];
      store.dispatch(setURL(selectedFile));
     
      console.log(`🎬 Omniverse updated to time: ${currentTime}, USD File: ${selectedFile}`);
    } catch (error) {
      console.error('Failed to update Omniverse:', error);
    }
  }

  /**
   * Sync time range to Power BI (used in historical mode)
   */
  async syncTimeRange(startTime: string, endTime: string): Promise<void> {
    try {
      await powerBIFilterService.applyTimeRangeFilter(startTime, endTime);
      console.log(`📊 Power BI time range set: ${startTime} to ${endTime}`);
    } catch (error) {
      console.error('Failed to set Power BI time range:', error);
    }
  }

  /**
   * Notify Omniverse about mode change
   */
  notifyModeChange(mode: 'historical' | 'realtime'): void {
    // If there is no active streaming setup, there is no controller to notify
    if (!this.isStreamingEnabled()) {
      return;
    }

    try {
      // const message = {
      //   event_type: 'timeModeChange',
      //   payload: {
      //     mode: mode,
      //   },
      // };

    //  AppStreamer.sendMessage(JSON.stringify(message));
      console.log(`🎬 Omniverse mode changed to: ${mode}`);
    } catch (error) {
      console.error('Failed to notify Omniverse of mode change:', error);
    }
  }

  /**
   * Clear all time-related filters
   */
  async clearTimeFilters(): Promise<void> {
    try {
      await powerBIFilterService.clearFilters();
      console.log('🧹 Time filters cleared');
    } catch (error) {
      console.error('Failed to clear time filters:', error);
    }
  }
}

export const timeIntegrationService = new TimeIntegrationService();
