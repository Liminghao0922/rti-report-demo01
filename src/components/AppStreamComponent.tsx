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

import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../state/store';
import './AppStreamComponent.css';
import { AppStreamer, StreamEvent, StreamType} from '@nvidia/omniverse-webrtc-streaming-library';

import { setRemoteStream, setServer } from '../state/slice/appStreamSlice';
import { setKitState } from '../state/slice/appStreamSlice';
import { setURL, setLoadingState } from '../state/slice/usdStorageSlice';
import { setLoadedURL } from '../state/slice/usdStorageSlice';
import { setSelectionChangeOrigin } from '../state/slice/selectionSlice';
import { setSelectionWithOrigin } from '../state/slice/selectionSlice';

const AppStreamComponent: React.FC = () => {
    const sessionService = useSelector((state: RootState) => state.service.sessionService);
    const server = useSelector((state: RootState) => state.appStream.server);
    const remoteStream = useSelector((state: RootState) => state.appStream.remoteStream);
    const kitState = useSelector((state: RootState) => state.appStream.kitState);

    const dispatch = useDispatch();
    const isPolling = useRef(false);
    const kitStateRef = useRef<'unknown' | 'responsive'>(kitState);

    // Update the ref whenever kitState changes
    useEffect(() => {
        kitStateRef.current = kitState;
    }, [kitState]);

    // Function to poll Kit
    const _pollKit = async () => {
        if (isPolling.current) return;  // Prevent duplicate polling processes
        isPolling.current = true;

        // Poll every second as long as Kit is not responsive
        while (kitStateRef.current == 'unknown') {
            console.log("Polling Kit for responsiveness.");

            // Send the request message
            const request = {
                event_type: "loadingStateQuery",
                payload: {}
            };

            AppStreamer.sendMessage(JSON.stringify(request));

            // Wait for 1 second before checking again
            await new Promise(resolve => setTimeout(resolve, 1000));

            //@ts-ignore
            if (kitStateRef.current == 'responsive') {
                isPolling.current = false;
                break;
            }
        }
    };

    // Define the custom onStart function with polling
    const handleStreamStart = async (message: StreamEvent) => {
        console.log('Stream Started:', message);
        if (message.status === 'success') {
            _pollKit();
        }
    };

    const handleStreamUpdate = (message: StreamEvent) => {
        console.log('Stream Update:', message);
    };

    const handleStreamCustomEvent = (message: any) => {
        if (message.event_type === "loadingStateResponse") {
            if (kitStateRef.current === 'unknown') {
                console.log('Kit is responsive, stopping polling.');
                dispatch(setKitState('responsive'));
                if (message.payload.loading_state == 'idle') {
                    dispatch(setLoadingState('idle'));
                }
                else {
                    dispatch(setLoadingState('loading'));
                }
                dispatch(setLoadedURL(message.payload.url));
            }
        } else if (message.event_type === "openedStageResult") {
            dispatch(setLoadingState('idle'));
            dispatch(setLoadedURL(message.payload.url));
        } else if (message.event_type === "stageSelectionChanged") {
            if (!Array.isArray(message.payload.prims) || message.payload.prims.length === 0) {
                console.log('Kit App selection empty.');
                dispatch(setSelectionWithOrigin({ assetIds: [], origin: 'kit' }));
            } else {
                console.log('Kit App selection: ' + message.payload.prims.map((obj: any) => obj).join(', '));
                dispatch(setSelectionWithOrigin({ assetIds: message.payload.prims, origin: 'kit' }));
            }
            // Reset to client selection change origin
            const timeoutId = setTimeout(() => {
                dispatch(setSelectionChangeOrigin('client'));
            }, 0); // Delay to ensure state has updated
            return () => clearTimeout(timeoutId); // Clean up the timeout

        } else {
            console.log('Stream Custom Event:', message);
        }
    };

    const handleStreamStop = (message: StreamEvent) => {
        console.log('Stream Stopped:', message);
        dispatch(setServer(''));  // Dispatch to reset server
        dispatch(setKitState('unknown'));  // Dispatch to mark Kit as unresponsive
    };

    const handleStreamTerminate = (message: StreamEvent) => {
        console.log('Stream Terminated:', message);
        dispatch(setServer(''));  // Dispatch to reset server
        dispatch(setKitState('unknown'));  // Dispatch to mark Kit as unresponsive
    };

    // React to changes in the server state
    useEffect(() => {
        if (server) {
            console.log(`Server URL changed to: ${server}`);
            _connectLocalStream();
        }
    }, [server]);

    const _connectLocalStream = () => {
        // Read signaling port and media configuration from environment variables
        const signalingPort = parseInt(import.meta.env.VITE_STREAMING_SIGNALING_PORT || process.env.STREAMING_SIGNALING_PORT || '49100');
        const mediaServer = import.meta.env.VITE_STREAMING_MEDIA_SERVER || process.env.STREAMING_MEDIA_SERVER || server;
        const mediaPortStr = import.meta.env.VITE_STREAMING_MEDIA_PORT || process.env.STREAMING_MEDIA_PORT;
        const mediaPort = mediaPortStr ? parseInt(mediaPortStr) : undefined;

        const streamConfig: any = {
            videoElementId: 'remote-video',
            audioElementId: 'remote-audio',
            authenticate: true,
            maxReconnects: 5,
            signalingServer: server,
            signalingPort: signalingPort,
            mediaServer: mediaServer,
            nativeTouchEvents: true,
            width: 1920,
            height: 1080,
            fps: 60,
            cursor: 'free',
            autolaunch: true,
            onUpdate: handleStreamUpdate,
            onStart: handleStreamStart,
            onCustomEvent: handleStreamCustomEvent,
            onStop: handleStreamStop,
            onTerminate: handleStreamTerminate,
        };

        // Only add mediaPort if it's specified
        if (mediaPort !== undefined) {
            streamConfig.mediaPort = mediaPort;
        }

        AppStreamer.connect({
            streamSource: StreamType.DIRECT,
            streamConfig: streamConfig
        })
            .then((result: StreamEvent) => {
                console.info('AppStreamer Setup Success:', result);
            })
            .catch((error: StreamEvent) => {
                console.error('AppStreamer Setup Error:', error);
            });
    }

    useEffect(() => {
        if (remoteStream && remoteStream.signalingserver) {
            console.log(`OVAS Server changed to: ${remoteStream}`);
            _connectOVASStream();
        }
    }, [remoteStream]
    );

    const _connectOVASStream = () => {
        AppStreamer.connect({
            streamSource: 'direct',
            streamConfig: {
                videoElementId: 'remote-video',
                audioElementId: 'remote-audio',
                signalingserver: remoteStream.signalingserver,
                signalingport: remoteStream.signalingport,
                mediaserver: remoteStream.mediaserver,
                mediaport: remoteStream.mediaport,
                accessToken: remoteStream.accessToken,
                sessionid: remoteStream.sessionid,
                authenticate: false,
                maxReconnects: 30,
                connectivityTimeout: 120000,
                nativeTouchEvents: true,
                width: 1920,
                height: 1080,
                fps: 60,
                cursor: 'free',
                autolaunch: true,
                onUpdate: handleStreamUpdate,
                onStart: handleStreamStart,
                onCustomEvent: handleStreamCustomEvent,
                onStop: handleStreamStop,
                onTerminate: handleStreamTerminate,
            }
        })
            .then((result: StreamEvent) => {
                console.info('AppStreamer Setup Success:', result);
            })
            .catch((error: StreamEvent) => {
                console.error('AppStreamer Setup Error:', error);
            });
    };

    useEffect(() => {
        if (sessionService.desiredState === 'destroyed') {
            AppStreamer.terminate();
            dispatch(setKitState('unknown'));
            dispatch(setLoadingState('idle'));
            dispatch(setLoadedURL(''));
            dispatch(setURL(''));
            dispatch(setRemoteStream({
                signalingserver: '',
                signalingport: 0,
                mediaserver: '',
                mediaport: 0,
                accessToken: '',
                sessionid: '',
            }));
        }
    }, [sessionService]);

    return (
        <div
            key={'stream-canvas'}
            id={'main-div'}
            style={{
                outline: 'none',
            }}
        >
            <div
                id={'aspect-ratio-div'}
                tabIndex={0}
                style={{
                    position: 'relative',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    paddingBottom: '56.25%',
                    outline: 'none'
                }}
            >
                {/* Ensure the video and audio elements are rendered */}
                <video
                    key={'video-canvas'}
                    id={'remote-video'}
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        outline: 'none'
                    }}
                    tabIndex={-1}
                    playsInline
                    muted
                    autoPlay
                />
                <audio id="remote-audio" muted></audio>
                <h3 style={{ visibility: 'hidden' }} id="message-display">...</h3>
            </div>
        </div>
    );
};

export default AppStreamComponent;
