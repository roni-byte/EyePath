import h337 from "heatmap.js";
import { useEffect, useRef, useState } from "react";

export default function HeatmapResult({ base64Data, points }) {
  const heatmapContainerRef = useRef(null);
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const img = new Image();
    img.src = `data:image/png;base64,${base64Data}`;
    img.onload = () => {
      setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
  }, [base64Data]);

  useEffect(() => {
    if (
      !heatmapContainerRef.current ||
      !points ||
      points.length === 0 ||
      imageSize.w === 0
    )
      return;

    heatmapContainerRef.current.innerHTML = "";

    const containerW = 800;
    const containerH = 600;

    const scale = Math.min(containerW / imageSize.w, containerH / imageSize.h);
    const renderedW = imageSize.w * scale;
    const renderedH = imageSize.h * scale;
    const offsetX = (containerW - renderedW) / 2;
    const offsetY = (containerH - renderedH) / 2;

    const instance = h337.create({
      container: heatmapContainerRef.current,
      radius: 35,
      maxOpacity: 0.6,
      minOpacity: 0,
      blur: 0.75,
      backgroundColor: "rgba(0,0,0,0)",
    });

    const data = {
      max: 5,
      data: points.map((p) => ({
        x: Math.round(offsetX + p.x * renderedW),
        y: Math.round(offsetY + p.y * renderedH),
        value: 1,
      })),
    };

    instance.setData(data);
  }, [points, imageSize]);

  return (
    <div
      style={{
        position: "relative",
        width: "800px",
        height: "600px",
        background: "#000",
        margin: "0 auto",
        border: "1px solid #444",
      }}
    >
      <img
        src={`data:image/png;base64,${base64Data}`}
        alt="heatmap-bg"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          zIndex: 1,
        }}
      />
      <div
        ref={heatmapContainerRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 2,
        }}
      />
    </div>
  );
}
