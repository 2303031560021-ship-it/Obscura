"use client";
import { useEffect, useState, useRef } from "react";

const TypewriterText = ({ text, speed = 40, cursor = "none" }) => {
  const [displayText, setDisplayText] = useState("");
  const indexRef = useRef(0);
  const hasStarted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;

          const interval = setInterval(() => {
            indexRef.current++;

            setDisplayText(text.slice(0, indexRef.current));

            if (indexRef.current >= text.length) {
              clearInterval(interval);
            }
          }, speed);
        }
      },
      { threshold: 0.35 }
    );

    const el = document.getElementById("typewriter");
    if (el) observer.observe(el);

    return () => observer.disconnect();
  }, [text, speed]);

  return (
    <span id="typewriter" className="inline-flex items-center">
      {displayText}
      {cursor === "infinite" && (
        <span
          className="ml-1 animate-pulse"
          style={{
            width: "3px",
            height: "0.9em",
            backgroundColor: "#CCFF00",
            borderRadius: "2px",
          }}
        />
      )}
    </span>
  );
};

export default TypewriterText;