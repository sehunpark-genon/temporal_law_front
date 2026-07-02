import { useQuery } from "@tanstack/react-query";
import { Card, Table, Tag, Space, Typography } from "antd";
import { Link } from "react-router-dom";
import { api } from "../api";
import { fmt } from "./Dashboard";

const { Text } = Typography;

export default function History() {
  const hist = useQuery({ queryKey: ["sync-history"], queryFn: () => api.syncHistory(100) });
  const fails = useQuery({ queryKey: ["failures"], queryFn: api.failures });

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card title={`실패 (재처리 대상) — ${fails.data?.length ?? 0}건`}>
        <Table
          rowKey="law_id" size="small" loading={fails.isFetching} dataSource={fails.data ?? []}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: "법령", dataIndex: "law_name", render: (v, r) => <Link to={`/laws/${r.law_id}`}>{v}</Link> },
            { title: "시도", dataIndex: "attempts", width: 70 },
            { title: "마지막 오류", dataIndex: "last_error", render: (v) => <Text type="danger" ellipsis style={{ maxWidth: 400 }}>{v}</Text> },
            { title: "확인시각", dataIndex: "last_checked_at", width: 180, render: fmt },
          ]}
        />
      </Card>

      <Card title="변경 이력 (sync_history)">
        <Table
          rowKey={(r) => r.law_id + (r.changed_at ?? "")} size="small" loading={hist.isFetching} dataSource={hist.data ?? []}
          pagination={{ pageSize: 15 }}
          columns={[
            { title: "법령", dataIndex: "law_name", render: (v, r) => <Link to={`/laws/${r.law_id}`}>{v}</Link> },
            { title: "사유", dataIndex: "reason", width: 150, render: (v) => <Tag>{v}</Tag> },
            { title: "이전 지문", dataIndex: "old_signature", width: 160, render: (v) => <Text code>{v ?? "-"}</Text> },
            { title: "새 지문", dataIndex: "new_signature", width: 160, render: (v) => <Text code>{v ?? "-"}</Text> },
            { title: "변경시각", dataIndex: "changed_at", width: 180, render: fmt },
          ]}
        />
      </Card>
    </Space>
  );
}
