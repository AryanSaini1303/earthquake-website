"use client";

import { useEffect, useState } from "react";

export default function ESP32DataViewer() {
  const [data, setData] = useState(null);
  const [responseTime, setResponseTime] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const start = Date.now(); // ✅ Correct usage

      try {
        const res = await fetch("/api/receiveData");
        const json = await res.json();
        const end = Date.now(); // ✅

        setData(json.data);
        setResponseTime((end - start).toFixed(2)); // in ms
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }, 100); // every 100ms

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1>Latest ESP32 Data:</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <h2>⏱️ Response Time: {responseTime} ms</h2>
    </div>
  );
}
