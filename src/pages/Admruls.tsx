import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Input, Table, Tag, Select, Space, Segmented } from "antd";
import { Link } from "react-router-dom";
import { api } from "../api";
import { fmt } from "./Dashboard";

const statusColor: Record<string, string> = { done: "green", pending: "gold", failed: "red" };
const KIND_COLOR: Record<string, string> = { admrul: "geekblue", school: "magenta", pi: "cyan", public: "purple" };
const KIND_LABEL: Record<string, string> = { admrul: "행정규칙", school: "학칙", pi: "공단정관", public: "공공기관" };
const CATS = [
  { label: "전체", value: "" }, { label: "행정규칙(고시)", value: "admrul" },
  { label: "학칙", value: "school" }, { label: "공단정관", value: "pi" }, { label: "공공기관", value: "public" },
];

export default function Admruls() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [cat, setCat] = useState("");
  const [order, setOrder] = useState<string>("name");
  const [page, setPage] = useState(1);
  const size = 20;

  const { data, isFetching } = useQuery({
    queryKey: ["admruls", query, status, cat, order, page],
    queryFn: () => api.admruls({ query: query || undefined, status, doc_target: cat || undefined, order, page, size }),
  });
  const reset = () => setPage(1);

  return (
    <Card title="행정규칙류 (고시·학칙·공단정관·공공기관)">
      <Segmented style={{ marginBottom: 14 }} value={cat} options={CATS}
        onChange={(v) => { setCat(v as string); reset(); }} />
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search allowClear placeholder="문서명 검색" style={{ width: 260 }}
          onSearch={(v) => { setQuery(v); reset(); }} />
        <Select placeholder="상태" allowClear style={{ width: 120 }} value={status}
          onChange={(v) => { setStatus(v); reset(); }}
          options={[{ value: "done", label: "수집완료" }, { value: "pending", label: "대기" }, { value: "failed", label: "실패" }]} />
        <Select value={order} style={{ width: 150 }} onChange={(v) => { setOrder(v); reset(); }}
          options={[{ value: "name", label: "이름순" }, { value: "col_desc", label: "수집일 ↓" }, { value: "col_asc", label: "수집일 ↑" }]} />
      </Space>
      <Table
        rowKey="adm_uid" loading={isFetching} size="middle"
        dataSource={data?.items ?? []}
        pagination={{ current: page, pageSize: size, total: data?.total ?? 0, onChange: setPage, showTotal: (t) => `총 ${t}건` }}
        columns={[
          { title: "종별", dataIndex: "doc_target", width: 110,
            render: (v) => <Tag color={KIND_COLOR[v] ?? "default"}>{KIND_LABEL[v] ?? v}</Tag> },
          { title: "문서명", dataIndex: "adm_name",
            render: (v, r) => <Link to={`/admruls/${encodeURIComponent(r.adm_uid)}`}>{v}</Link> },
          { title: "종류", dataIndex: "adm_type", width: 120 },
          { title: "소관부처", dataIndex: "ministry", width: 140 },
          { title: "시행일", dataIndex: "enforcement_date", width: 100 },
          { title: "수집일", dataIndex: "last_collected_at", width: 170, render: fmt },
          { title: "상태", dataIndex: "status", width: 90,
            render: (v) => v ? <Tag color={statusColor[v]}>{v}</Tag> : <Tag>미등록</Tag> },
        ]}
      />
    </Card>
  );
}
