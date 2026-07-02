import { useQuery } from "@tanstack/react-query";
import { Card, Col, Row, Statistic, Tag, Table, Badge, Spin } from "antd";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function Dashboard() {
  const stats = useQuery({ queryKey: ["stats"], queryFn: api.stats, refetchInterval: 5000 });
  const worker = useQuery({ queryKey: ["worker"], queryFn: api.worker, refetchInterval: 5000 });
  const runs = useQuery({ queryKey: ["runs", 8], queryFn: () => api.runs(8), refetchInterval: 5000 });

  const s = stats.data;
  return (
    <Spin spinning={stats.isLoading}>
      <Row gutter={16}>
        <Col span={4}><Card><Statistic title="현행 법령" value={s?.catalog_active ?? 0} /></Card></Col>
        <Col span={4}><Card><Statistic title="수집 완료" value={s?.done ?? 0} valueStyle={{ color: "#3f8600" }} /></Card></Col>
        <Col span={4}><Card><Statistic title="대기" value={s?.pending ?? 0} /></Card></Col>
        <Col span={4}><Card><Statistic title="실패" value={s?.failed ?? 0} valueStyle={{ color: s?.failed ? "#cf1322" : undefined }} /></Card></Col>
        <Col span={4}><Card><Statistic title="폐지" value={s?.repealed ?? 0} /></Card></Col>
        <Col span={4}>
          <Card>
            <div style={{ color: "#888", fontSize: 14 }}>워커</div>
            <div style={{ marginTop: 8 }}>
              <Badge status={worker.data?.online ? "success" : "error"}
                     text={worker.data?.online ? `온라인 (${worker.data.pollers})` : "오프라인"} />
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="최근 실행" style={{ marginTop: 16 }} extra={<Link to="/ops">전체 보기</Link>}>
        <Table
          rowKey="run_id" size="small" pagination={false}
          dataSource={runs.data ?? []}
          columns={[
            { title: "워크플로", dataIndex: "type" },
            { title: "ID", dataIndex: "workflow_id" },
            { title: "상태", dataIndex: "status", render: (v) => <StatusTag v={v} /> },
            { title: "시작", dataIndex: "start_time", render: fmt },
          ]}
        />
      </Card>
    </Spin>
  );
}

export function StatusTag({ v }: { v: string | null }) {
  const color: Record<string, string> = {
    RUNNING: "processing", COMPLETED: "success", FAILED: "error",
    TERMINATED: "default", CANCELED: "warning",
  };
  return <Tag color={color[v ?? ""] ?? "default"}>{v ?? "-"}</Tag>;
}
export const fmt = (v: string | null) => (v ? new Date(v).toLocaleString("ko-KR") : "-");
