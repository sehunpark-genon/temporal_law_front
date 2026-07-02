import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Space, Table, InputNumber, Checkbox, message, Popconfirm, Badge, Typography } from "antd";
import { api } from "../api";
import { StatusTag, fmt } from "./Dashboard";

const { Text } = Typography;

export default function Ops() {
  const qc = useQueryClient();
  const [limit, setLimit] = useState<number | null>(5);
  const [all, setAll] = useState(false);

  const worker = useQuery({ queryKey: ["worker"], queryFn: api.worker, refetchInterval: 5000 });
  const runs = useQuery({ queryKey: ["runs", 30], queryFn: () => api.runs(30), refetchInterval: 3000 });

  const opts = (name: string) => ({
    onSuccess: (d: any) => { message.success(`${name} 시작됨 (${d.workflow_id ?? ""})`); qc.invalidateQueries({ queryKey: ["runs", 30] }); },
    onError: (e: any) => message.error(`${name} 실패: ${e?.message ?? e}`),
  });
  const mDiscover = useMutation({ mutationFn: () => api.discover(all), ...opts("discover") });
  const mBackfill = useMutation({ mutationFn: () => api.backfill(limit ?? undefined), ...opts("backfill") });
  const mSync = useMutation({ mutationFn: () => api.sync(), ...opts("sync") });
  const mTerm = useMutation({
    mutationFn: (id: string) => api.terminate(id),
    onSuccess: () => { message.success("종료 요청됨"); qc.invalidateQueries({ queryKey: ["runs", 30] }); },
  });

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card title="워크플로 실행" extra={
        <Badge status={worker.data?.online ? "success" : "error"}
               text={worker.data?.online ? `워커 온라인(${worker.data.pollers})` : "워커 오프라인 — 먼저 워커를 띄우세요"} />}>
        {!worker.data?.online && (
          <div style={{ marginBottom: 12, color: "#cf1322" }}>
            ⚠️ 워커가 꺼져 있으면 실행해도 대기만 합니다: <code>uv run python -m pipeline.worker</code>
          </div>
        )}
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          {/* discover — 목록만 갱신 (수집 아님) */}
          <Space align="center">
            <Button style={{ width: 120 }} onClick={() => mDiscover.mutate()} loading={mDiscover.isPending}>discover</Button>
            <Checkbox checked={all} onChange={(e) => setAll(e.target.checked)}>시행령·규칙까지</Checkbox>
            <Text type="secondary">전체 목록 새로고침 → catalog 갱신(신규·폐지·지문). <b>수집 아님</b></Text>
          </Space>
          {/* backfill — pending·failed 수집. N 비우면 전부 */}
          <Space align="center">
            <Button style={{ width: 120 }} type="primary" onClick={() => mBackfill.mutate()} loading={mBackfill.isPending}>backfill</Button>
            <InputNumber min={1} placeholder="전체" value={limit ?? undefined}
              onChange={(v) => setLimit(v)} style={{ width: 130 }} addonBefore="건수" />
            <Text type="secondary"><b>pending·failed</b> 법령 수집. 건수 비우면 <b>전부</b>, 넣으면 그만큼(테스트).</Text>
          </Space>
          {/* sync — 변경분만 */}
          <Space align="center">
            <Button style={{ width: 120 }} onClick={() => mSync.mutate()} loading={mSync.isPending}>sync</Button>
            <Text type="secondary">목록 갱신 후 <b>지문 바뀐 법만</b> 재수집(매일 도는 것과 동일).</Text>
          </Space>
        </Space>
      </Card>

      <Card title="실행 목록" extra={<Button size="small" onClick={() => runs.refetch()}>새로고침</Button>}>
        <Table
          rowKey="run_id" size="small" loading={runs.isFetching}
          dataSource={runs.data ?? []}
          pagination={{ pageSize: 15 }}
          columns={[
            { title: "워크플로", dataIndex: "type", width: 200 },
            { title: "ID", dataIndex: "workflow_id" },
            { title: "상태", dataIndex: "status", width: 120, render: (v) => <StatusTag v={v} /> },
            { title: "시작", dataIndex: "start_time", width: 180, render: fmt },
            { title: "종료", dataIndex: "close_time", width: 180, render: fmt },
            { title: "", width: 80, render: (_, r) => r.status === "RUNNING" && (
              <Popconfirm title="이 워크플로를 종료할까요?" onConfirm={() => mTerm.mutate(r.workflow_id)}>
                <Button danger size="small">종료</Button>
              </Popconfirm>) },
          ]}
        />
      </Card>
    </Space>
  );
}
