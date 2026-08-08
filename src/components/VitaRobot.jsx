import React from "react";

export function VitaRobot({ size = 80, className = "" }) {
  return (
    <img
      src="/vita-robot.png"
      alt="VITA"
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: "contain",
        display: "block",
        mixBlendMode: "multiply",
      }}
    />
  );
}
