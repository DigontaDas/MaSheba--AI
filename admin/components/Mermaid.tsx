"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    
    // Dynamic import to prevent SSR rendering issues with mermaid.js
    import("mermaid")
      .then((mermaidModule) => {
        const mermaid = mermaidModule.default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
          themeVariables: {
            primaryColor: "#0f1e27",
            primaryTextColor: "#e8f4f0",
            primaryBorderColor: "#234054",
            lineColor: "#4d7588",
            secondaryColor: "#111d24",
            tertiaryColor: "#0b1318",
            edgeLabelBackground: "#0b1318",
            clusterBkg: "#111d24",
            clusterBorder: "#1a3040",
            titleColor: "#00d4aa",
            nodeTextColor: "#e8f4f0",
          },
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: "basis",
          },
        });
        
        const uniqueId = `mermaid-${Math.floor(Math.random() * 100000)}`;
        return mermaid.render(uniqueId, chart);
      })
      .then(({ svg: renderedSvg }) => {
        if (isMounted) {
          setSvg(renderedSvg);
          setError(false);
        }
      })
      .catch((err) => {
        console.error("Mermaid rendering failed:", err);
        if (isMounted) {
          setError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-300 rounded-lg text-sm">
        Failed to render diagram. Please verify syntax or reload the page.
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="flex justify-center p-6 rounded-xl overflow-x-auto my-4 w-full"
      style={{
        background: "var(--bg3, #111d24)",
        border: "1px solid var(--border, #1a3040)",
      }}
      dangerouslySetInnerHTML={{ __html: svg || '<div class="text-slate-500 py-10 animate-pulse text-sm">Rendering flowchart...</div>' }}
    />
  );
}
