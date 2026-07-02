import { Layout, Menu } from "antd";
import {
  DashboardOutlined, FileTextOutlined, ThunderboltOutlined,
  ScheduleOutlined, HistoryOutlined,
} from "@ant-design/icons";
import { Link, Route, Routes, useLocation, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Laws from "./pages/Laws";
import LawDetail from "./pages/LawDetail";
import Ops from "./pages/Ops";
import SchedulePage from "./pages/Schedule";
import History from "./pages/History";

const { Sider, Header, Content } = Layout;

const MENU = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: <Link to="/dashboard">대시보드</Link> },
  { key: "/laws", icon: <FileTextOutlined />, label: <Link to="/laws">법령</Link> },
  { key: "/ops", icon: <ThunderboltOutlined />, label: <Link to="/ops">운영(실행)</Link> },
  { key: "/schedule", icon: <ScheduleOutlined />, label: <Link to="/schedule">스케줄</Link> },
  { key: "/history", icon: <HistoryOutlined />, label: <Link to="/history">이력</Link> },
];

export default function App() {
  const loc = useLocation();
  const selected = "/" + (loc.pathname.split("/")[1] || "dashboard");
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="dark" breakpoint="lg" collapsedWidth="0">
        <div style={{ color: "#fff", fontWeight: 700, padding: "16px", fontSize: 15 }}>
          ⚖️ 법령 파이프라인
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selected]} items={MENU} />
      </Sider>
      <Layout>
        <Header style={{ background: "#fff", paddingInline: 24, fontWeight: 600 }}>
          법제처 법령 수집·적재 관리
        </Header>
        <Content style={{ margin: 24 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/laws" element={<Laws />} />
            <Route path="/laws/:lawId" element={<LawDetail />} />
            <Route path="/ops" element={<Ops />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}
