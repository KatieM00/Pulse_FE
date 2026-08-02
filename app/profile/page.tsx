export default function ProfilePage() {
  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "#ffffff",
        padding: "32px 20px",
        color: "#1A1A1A",
      }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: -0.4,
          margin: "0 0 6px",
        }}
      >
        Profile
      </h1>
      <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 32px" }}>
        Personalise your Pulse experience.
      </p>

      <div
        style={{
          background: "#FAFAFA",
          borderRadius: 14,
          border: "0.5px solid rgba(0,0,0,0.10)",
          padding: "16px",
          fontSize: 14,
          color: "#9CA3AF",
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        Profiles and preferences are coming soon.
        <br />
        This feature is planned for the next build sprint.
      </div>
    </div>
  );
}
