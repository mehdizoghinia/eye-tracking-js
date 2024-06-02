// app/page.tsx

import React from 'react';
import dynamic from 'next/dynamic';

const WebcamComponent = dynamic(() => import('../components/WebcamComponent'), { ssr: false });

export default function Home() {
  return (
    <div>
      <h1>Eye Tracking Timer</h1>
      <WebcamComponent />
    </div>
  );
}
