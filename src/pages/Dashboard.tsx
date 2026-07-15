import { useQuery } from "@tanstack/react-query";
import { Card, Col, Row, Statistic, Tag, Table, Badge, Spin } from "antd";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function Dashboard() {
  const stats = useQuery({ queryKey: ["stats"], queryFn: api.stats, refetchInterval: 5000 });
  const worker = useQuery({ queryKey: ["worker"], queryFn: api.worker, refetchInterval: 5000 });
  const runs = useQuery({ queryKey: ["runs", 8], queryFn: () => api.runs(8), refetchInterval: 5000 });
  const cfg = useQuery({ queryKey: ["config"], queryFn: api.config });
  const admStats = useQuery({ queryKey: ["admrul-stats"], queryFn: api.admrulStats, refetchInterval: 5000 });

  const s = stats.data;
  const c = cfg.data;
  const listName = (p: string | null) => (p ? p.split("/").pop() : null);
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

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card size="small" title="수집 스코프 (env)">
            <div>법령: {c?.law_include_list
              ? <Tag color="blue">리스트 {listName(c.law_include_list)}</Tag>
              : <Tag>전체{c?.law_only ? " (법률만)" : ""}</Tag>}</div>
            <div style={{ marginTop: 6 }}>행정규칙: {c?.admrul_enabled
              ? <>{<Tag color="green">ON</Tag>}{c?.admrul_include_list
                  ? <Tag color="blue">리스트 {listName(c.admrul_include_list)}</Tag>
                  : <Tag>전체</Tag>}</>
              : <Tag>OFF</Tag>}</div>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title={<Link to="/admruls">행정규칙 현황 →</Link>}>
            <Row>
              <Col span={8}><Statistic title="현행" value={admStats.data?.catalog_active ?? 0} /></Col>
              <Col span={8}><Statistic title="수집완료" value={admStats.data?.done ?? 0} valueStyle={{ color: "#3f8600" }} /></Col>
              <Col span={8}><Statistic title="대기/실패" value={(admStats.data?.pending ?? 0) + (admStats.data?.failed ?? 0)} /></Col>
            </Row>
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
