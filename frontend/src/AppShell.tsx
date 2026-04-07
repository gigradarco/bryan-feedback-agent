import { NavLink, Outlet } from "react-router-dom";

export default function AppShell() {
  return (
    <>
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
          background: "rgba(12, 13, 16, 0.92)",
          backdropFilter: "blur(8px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <NavLink
          to="/events"
          style={({ isActive }) => ({
            fontWeight: 600,
            color: isActive ? "var(--text)" : "var(--muted)",
          })}
        >
          Feedback sim
        </NavLink>
        <nav style={{ display: "flex", gap: 16, marginLeft: "auto", alignItems: "center" }}>
          <NavLink
            to="/rewards"
            style={({ isActive }) => ({
              fontSize: "0.9375rem",
              color: isActive ? "var(--accent)" : "var(--muted)",
            })}
          >
            Rewards
          </NavLink>
          <NavLink
            to="/organizer"
            style={({ isActive }) => ({
              fontSize: "0.9375rem",
              color: isActive ? "var(--accent)" : "var(--muted)",
            })}
          >
            Organizer
          </NavLink>
        </nav>
      </header>
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </>
  );
}
