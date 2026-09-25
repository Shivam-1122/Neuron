import React, { useRef, useEffect } from 'react';

export default function MemoryGameHub({ apiBase = '', userId = '', onBackToPatient }) {
    const iframeRef = useRef(null);

    // Build URL query params with api_base and user_id so game iframe connects to real backend
    const queryParams = new URLSearchParams();
    queryParams.set('embedded', 'true');
    if (apiBase) queryParams.set('api_base', apiBase);
    if (userId) queryParams.set('user_id', userId);

    const iframeSrc = `/game/index.html?${queryParams.toString()}`;

    useEffect(() => {
        const sendConfig = () => {
            if (iframeRef.current?.contentWindow) {
                try {
                    iframeRef.current.contentWindow.postMessage(
                        {
                            type: 'NEURON_CONFIG',
                            apiBase: apiBase,
                            userId: userId,
                        },
                        '*'
                    );
                } catch (e) {
                    console.warn('Failed to postMessage to game iframe:', e);
                }
            }
        };

        const handleMessage = (event) => {
            if (event.data?.type === 'REQUEST_CONFIG') {
                sendConfig();
            }
        };

        window.addEventListener('message', handleMessage);
        const iframeEl = iframeRef.current;
        if (iframeEl) {
            iframeEl.addEventListener('load', sendConfig);
        }

        return () => {
            window.removeEventListener('message', handleMessage);
            if (iframeEl) {
                iframeEl.removeEventListener('load', sendConfig);
            }
        };
    }, [apiBase, userId]);

    return (
        <div className="w-full h-full min-h-[calc(100vh-68px)] bg-[#111318] relative overflow-hidden">
            {/* Embedded Luxury Game without any secondary nav bars */}
            <iframe
                ref={iframeRef}
                src={iframeSrc}
                title="Neuron Memory Gym - Cognitive Sanctuary"
                className="w-full h-full border-none absolute inset-0"
                allow="autoplay; microphone"
            />
        </div>
    );
}
