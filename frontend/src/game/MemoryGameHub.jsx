import React, { useRef } from 'react';

export default function MemoryGameHub() {
    const iframeRef = useRef(null);

    return (
        <div className="w-full h-full min-h-[calc(100vh-68px)] bg-[#111318] relative overflow-hidden">
            {/* Embedded Luxury Game without any secondary nav bars */}
            <iframe
                ref={iframeRef}
                src="/game/index.html?embedded=true"
                title="Neuron Memory Gym - Cognitive Sanctuary"
                className="w-full h-full border-none absolute inset-0"
                allow="autoplay; microphone"
            />
        </div>
    );
}
