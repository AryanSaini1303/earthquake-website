"use client";

import { useEffect, useState } from "react";

export default function ESP32DataViewer() {
  const [data, setData] = useState(null);
  const [responseTime, setResponseTime] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLoop = async () => {
      while (isMounted) {
        const start = Date.now();
        try {
          const res = await fetch("/api/receiveData");
          const json = await res.json();
          const end = Date.now();

          if (isMounted) {
            setData(json.data);
            setResponseTime((end - start).toFixed(2));
          }
        } catch (error) {
          console.error("Failed to fetch data:", error);
        }

        await new Promise((resolve) => setTimeout(resolve, 50)); // wait 100ms before next loop
      }
    };

    fetchLoop(); // start the loop

    return () => {
      isMounted = false; // stop the loop on component unmount
    };
  }, []);

  return (
    <div>
      <h1>Latest ESP32 Data:</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <h2>⏱️ Response Time: {responseTime} ms</h2>
    </div>
  );
}
