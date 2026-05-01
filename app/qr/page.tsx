"use client";

import QRCode from "react-qr-code";

const DEMO_URL = "https://echo-nine-jet.vercel.app/";

export default function QRPage() {
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center gap-8 px-8"
      style={{ background: "#FAFBFD" }}
    >
      <div>
        <p
          className="text-center text-[13px] font-semibold uppercase tracking-widest mb-6"
          style={{ color: "#9AAAB8" }}
        >
          Scan to try Echo
        </p>
        <div
          className="p-5 rounded-2xl"
          style={{ background: "white", boxShadow: "0 4px 24px rgba(80,100,160,0.10)" }}
        >
          <QRCode value={DEMO_URL} size={200} />
        </div>
      </div>

      <p
        className="text-[13px] text-center"
        style={{ color: "#7A8A9A", wordBreak: "break-all" }}
      >
        {DEMO_URL}
      </p>
    </div>
  );
}
