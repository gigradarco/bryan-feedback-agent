import { Route, Routes } from "react-router-dom";
import AppShell from "./AppShell";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Organizer from "./pages/Organizer";
import Report from "./pages/Report";
import Rewards from "./pages/Rewards";

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<AppShell />}>
          <Route path="/events" element={<Home />} />
          <Route path="/chat/:eventId" element={<Chat />} />
          <Route path="/organizer" element={<Organizer />} />
          <Route path="/organizer/:eventId" element={<Report />} />
          <Route path="/rewards" element={<Rewards />} />
        </Route>
      </Routes>
    </div>
  );
}
