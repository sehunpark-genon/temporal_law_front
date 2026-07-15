import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Input, Table, Tag, Select, Space, Segmented } from "antd";
import { Link } from "react-router-dom";
import { api } from "../api";
import { fmt } from "./Dashboard";

const statusColor: Record<string, string> = { done: "green", pending: "gold", failed: "red" };
const CATS = [
  { label: "전체", value: "" }, { label: "법률", value: "법률" },
  { label: "시행령", value: "시행령" }, { label: "시행규칙", value: "시행규칙" },
];
// 법령명 접미로 법률/시행령/시행규칙 분류(법령구분명은 대통령령/부령이라 이름으로 구분)
function lawCat(name: string): string {
  if (name.endsWith("시행규칙")) return "시행규칙";
  if (name.endsWith("시행령")) return "시행령";
  return "법률";
}
const CAT_COLOR: Record<string, string> = { 법률: "blue", 시행령: "green", 시행규칙: "orange" };

export default function Laws() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [cat, setCat] = useState("");
  const [order, setOrder] = useState<string>("name");

  const { data, isFetching } = useQuery({
    queryKey: ["laws", query, status, order],
    queryFn: () => api.laws({ query: query || undefined, status, order, page: 1, size: 200 }),
  });

  const items = useMemo(() => {
    const all = data?.items ?? [];
    return cat ? all.filter((r) => lawCat(r.law_name) === cat) : all;
  }, [data, cat]);

  return (
    <Card title="법령 (법률·시행령·시행규칙)">
      <Segmented style={{ marginBottom: 14 }} value={cat} options={CATS} onChange={(v) => setCat(v as string)} />
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search allowClear placeholder="법령명 검색" style={{ width: 260 }} onSearch={setQuery} />
        <Select placeholder="상태" allowClear style={{ width: 120 }} value={status} onChange={setStatus}
          options={[{ value: "done", label: "수집완료" }, { value: "pending", label: "대기" }, { value: "failed", label: "실패" }]} />
        <Select value={order} style={{ width: 150 }} onChange={setOrder}
          options={[{ value: "name", label: "법령명순" }, { value: "ef_desc", label: "시행일 ↓(최신)" },
                    { value: "ef_asc", label: "시행일 ↑" }, { value: "col_desc", label: "수집일 ↓" }]} />
      </Space>
      <Table
        rowKey="law_id" loading={isFetching} size="middle"
        dataSource={items}
        pagination={{ pageSize: 20, showTotal: (t) => `총 ${t}건` }}
        columns={[
          { title: "구분", width: 90, render: (_, r) => {
            const c = lawCat(r.law_name); return <Tag color={CAT_COLOR[c]}>{c}</Tag>; } },
          { title: "법령명", dataIndex: "law_name",
            render: (v, r) => <Link to={`/laws/${r.law_id}`}>{v}</Link> },
          { title: "소관부처", dataIndex: "ministry", width: 130 },
          { title: "시행일", dataIndex: "enforcement_date", width: 100 },
          { title: "수집일", dataIndex: "last_collected_at", width: 170, render: fmt },
          { title: "상태", dataIndex: "status", width: 90,
            render: (v) => v ? <Tag color={statusColor[v]}>{v}</Tag> : <Tag>미등록</Tag> },
        ]}
      />
    </Card>
  );
}
