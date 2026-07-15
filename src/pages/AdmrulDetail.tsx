import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Card, Segmented, Descriptions, Tag, Input, Empty, Spin, Space, Collapse, Alert } from "antd";
import { api } from "../api";
import DocViewer from "../components/DocViewer";

const KIND_COLOR: Record<string, string> = {
  행정규칙: "geekblue", 학칙: "magenta", 공단정관: "cyan", 공공기관: "purple",
};

export default function AdmrulDetail() {
  const { admUid } = useParams();
  const [mode, setMode] = useState("본문 보기");
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["admrul", admUid], queryFn: () => api.admrul(admUid!) });

  if (isLoading) return <Spin />;
  if (!data) return <Empty description="문서를 찾을 수 없습니다" />;

  const p: any = data.payload;
  const articles = p?.body.articles ?? [];
  const filtered = q
    ? articles.filter((a: any) => (a.article_no + a.article_title + a.content).includes(q))
    : articles;
  const kind = p?.doc_kind ?? data.catalog?.adm_type;

  return (
    <Card
      title={<Space size="middle" wrap>
        <Link to="/admruls">← 목록</Link>
        <span style={{ fontSize: 18, fontWeight: 700 }}>{data.adm_name}</span>
        {kind && <Tag color={KIND_COLOR[kind] ?? "blue"}>{kind}</Tag>}
      </Space>}
      extra={<Segmented value={mode} onChange={(v) => setMode(v as string)} options={["본문 보기", "원본(JSON)"]} />}
    >
      <Descriptions size="small" bordered column={4} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="문서ID">{data.adm_id}</Descriptions.Item>
        <Descriptions.Item label="종류">{p?.law_type ?? data.catalog?.adm_type ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="시행일">{p?.enforcement_date ?? data.catalog?.enforcement_date ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="소관부처">{data.catalog?.ministry ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="조문수">{p?.body.article_count ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="인용수">{p?.relation_stats?.relations_total ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="별표수">{p?.appendices?.length ?? 0}</Descriptions.Item>
        <Descriptions.Item label="첨부">{p?.attachments?.length ?? 0}</Descriptions.Item>
      </Descriptions>

      {!p ? (
        <Alert type="info" showIcon message="아직 수집되지 않은 문서입니다." />
      ) : mode === "원본(JSON)" ? (
        <pre style={{ background: "#0d1117", color: "#c9d1d9", padding: 16, borderRadius: 8,
                      maxHeight: "70vh", overflow: "auto", fontSize: 12 }}>
          {JSON.stringify(p, null, 2)}
        </pre>
      ) : (
        <>
          <Input.Search allowClear placeholder="조문 검색(조번호·제목·본문)" style={{ maxWidth: 360, marginBottom: 12 }}
            onChange={(e) => setQ(e.target.value)} />
          <div style={{ maxHeight: "72vh", overflow: "auto", paddingRight: 8 }}>
            <DocViewer articles={filtered} appendices={p.appendices} attachments={p.attachments} />
            {(p.addenda?.length ?? 0) > 0 && (
              <Collapse style={{ marginTop: 16 }} items={[{
                key: "addenda", label: `부칙 ${p.addenda.length}건`,
                children: <Space direction="vertical" style={{ display: "flex" }}>
                  {p.addenda.map((ad: any, i: number) => (
                    <div key={i} style={{ borderBottom: "1px solid #f5f5f5", paddingBottom: 6 }}>
                      <b>{ad.promulgation_date}</b> {ad.promulgation_no && `(${ad.promulgation_no})`}
                      <div style={{ whiteSpace: "pre-wrap", color: "#555", fontSize: 13 }}>{ad.content}</div>
                    </div>
                  ))}
                </Space>,
              }]} />
            )}
          </div>
        </>
      )}
    </Card>
  );
}
