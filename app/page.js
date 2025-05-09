"use client";

import { useEffect, useState } from "react";

export default function ESP32DataViewer() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/receiveData");
      const json = await res.json();
      setData(json.data);
    }, 100); // Fetch every 1 second

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1>Latest ESP32 Data:</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
