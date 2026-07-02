import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Input, Button, Space, Tag, message, Popconfirm, Typography } from "antd";
import { api } from "../api";

const { Text, Paragraph } = Typography;

export default function SchedulePage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["schedule"], queryFn: api.schedule });
  const [cron, setCron] = useState("0 3 * * *");

  useEffect(() => {
    if (data?.cron?.[0]) setCron(data.cron[0]);
    else if (data?.default_cron) setCron(data.default_cron);
  }, [data]);

  const mSet = useMutation({
    mutationFn: () => api.setSchedule(cron),
    onSuccess: () => { message.success("스케줄 등록/갱신됨"); qc.invalidateQueries({ queryKey: ["schedule"] }); },
  });
  const mDel = useMutation({
    mutationFn: () => api.delSchedule(),
    onSuccess: () => { message.success("스케줄 해제됨"); qc.invalidateQueries({ queryKey: ["schedule"] }); },
  });

  return (
    <Card title="매일 동기(sync) 스케줄" style={{ maxWidth: 640 }}>
      <Paragraph>
        현재 상태:{" "}
        {data?.exists
          ? <Tag color="green">등록됨 · cron <code>{data.cron?.[0]}</code>{data.paused ? " (일시중지)" : ""}</Tag>
          : <Tag>미등록</Tag>}
      </Paragraph>
      <Space>
        <Input value={cron} onChange={(e) => setCron(e.target.value)} style={{ width: 200 }} addonBefore="cron" />
        <Button type="primary" onClick={() => mSet.mutate()} loading={mSet.isPending}>등록/갱신</Button>
        {data?.exists && (
          <Popconfirm title="스케줄을 해제할까요?" onConfirm={() => mDel.mutate()}>
            <Button danger>해제</Button>
          </Popconfirm>
        )}
      </Space>
      <Paragraph type="secondary" style={{ marginTop: 12 }}>
        <Text type="secondary">예) <code>0 3 * * *</code> = 매일 03:00. 스케줄이 도는 시각에 워커가 떠 있어야 실제 실행됩니다.</Text>
      </Paragraph>
    </Card>
  );
}
