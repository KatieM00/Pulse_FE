export default function SavedPage() {
  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        textAlign: "center",
        color: "#9CA3AF",
      }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#D1D5DB"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ marginBottom: 16 }}
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      <p style={{ fontSize: 15, fontWeight: 600, color: "#4B5563", marginBottom: 6 }}>
        Nothing saved yet
      </p>
      <p style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 240 }}>
        Tap the bookmark on any event to save it here for later.
      </p>
    </div>
  );
}
