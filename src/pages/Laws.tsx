import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Input, Table, Tag, Select, Space, DatePicker } from "antd";
import type { Dayjs } from "dayjs";
import { Link } from "react-router-dom";
import { api } from "../api";
import { fmt } from "./Dashboard";

const { RangePicker } = DatePicker;
const statusColor: Record<string, string> = { done: "green", pending: "gold", failed: "red" };

export default function Laws() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [dateField, setDateField] = useState<"ef" | "col">("ef"); // 기준: 시행일 / 수집일
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [order, setOrder] = useState<string>("name");
  const [page, setPage] = useState(1);
  const size = 20;

  // 기준에 따라 시행일(YYYYMMDD) / 수집일(YYYY-MM-DD) 파라미터로 변환
  const dateParams: Record<string, string> = {};
  if (range) {
    if (dateField === "ef") {
      dateParams.ef_from = range[0].format("YYYYMMDD");
      dateParams.ef_to = range[1].format("YYYYMMDD");
    } else {
      dateParams.col_from = range[0].format("YYYY-MM-DD");
      dateParams.col_to = range[1].format("YYYY-MM-DD");
    }
  }

  const { data, isFetching } = useQuery({
    queryKey: ["laws", query, status, dateField, range?.[0]?.valueOf(), range?.[1]?.valueOf(), order, page],
    queryFn: () => api.laws({ query: query || undefined, status, order, page, size, ...dateParams }),
  });

  const reset = () => setPage(1);

  return (
    <Card title="법령 목록">
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search allowClear placeholder="법령명 검색" style={{ width: 260 }}
          onSearch={(v) => { setQuery(v); reset(); }} />
        <Select placeholder="상태" allowClear style={{ width: 120 }} value={status}
          onChange={(v) => { setStatus(v); reset(); }}
          options={[{ value: "done", label: "수집완료" }, { value: "pending", label: "대기" }, { value: "failed", label: "실패" }]} />
        <Space.Compact>
          <Select value={dateField} style={{ width: 100 }}
            onChange={(v) => { setDateField(v); reset(); }}
            options={[{ value: "ef", label: "시행일" }, { value: "col", label: "수집일" }]} />
          <RangePicker onChange={(v) => { setRange(v as [Dayjs, Dayjs] | null); reset(); }} />
        </Space.Compact>
        <Select value={order} style={{ width: 150 }} onChange={(v) => { setOrder(v); reset(); }}
          options={[
            { value: "name", label: "법령명순" },
            { value: "ef_desc", label: "시행일 ↓(최신)" },
            { value: "ef_asc", label: "시행일 ↑" },
            { value: "col_desc", label: "수집일 ↓(최신)" },
            { value: "col_asc", label: "수집일 ↑" },
          ]} />
      </Space>
      <Table
        rowKey="law_id" loading={isFetching} size="middle"
        dataSource={data?.items ?? []}
        pagination={{ current: page, pageSize: size, total: data?.total ?? 0, onChange: setPage, showTotal: (t) => `총 ${t}건` }}
        columns={[
          { title: "법령명", dataIndex: "law_name",
            render: (v, r) => <Link to={`/laws/${r.law_id}`}>{v}</Link> },
          { title: "구분", dataIndex: "law_type", width: 90 },
          { title: "소관부처", dataIndex: "ministry", width: 120 },
          { title: "시행일", dataIndex: "enforcement_date", width: 100 },
          { title: "수집일", dataIndex: "last_collected_at", width: 170, render: fmt },
          { title: "상태", dataIndex: "status", width: 90,
            render: (v) => v ? <Tag color={statusColor[v]}>{v}</Tag> : <Tag>미등록</Tag> },
          { title: "현행", dataIndex: "is_active", width: 70,
            render: (v) => v ? <Tag color="blue">현행</Tag> : <Tag>폐지</Tag> },
        ]}
      />
    </Card>
  );
}
