import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Card, Segmented, Descriptions, Tag, Input, Empty, Spin, Space, Collapse, Alert } from "antd";
import { api } from "../api";
import DocViewer from "../components/DocViewer";

export default function LawDetail() {
  const { lawId } = useParams();
  const [mode, setMode] = useState("본문 보기");
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["law", lawId], queryFn: () => api.law(lawId!) });

  if (isLoading) return <Spin />;
  if (!data) return <Empty description="법령을 찾을 수 없습니다" />;

  const p = data.payload;
  const articles = p?.body.articles ?? [];
  const filtered = q
    ? articles.filter((a) => (a.article_no + a.article_title + a.content).includes(q))
    : articles;

  return (
    <Card
      title={<Space size="middle" wrap>
        <Link to="/laws">← 목록</Link>
        <span style={{ fontSize: 18, fontWeight: 700 }}>{data.law_name}</span>
        {p?.law_type && <Tag color="blue">{p.law_type}</Tag>}
      </Space>}
      extra={<Segmented value={mode} onChange={(v) => setMode(v as string)} options={["본문 보기", "원본(JSON)"]} />}
    >
      <Descriptions size="small" bordered column={4} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="법령ID">{data.law_id}</Descriptions.Item>
        <Descriptions.Item label="MST">{p?.mst ?? data.catalog?.mst ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="시행일">{p?.enforcement_date ?? data.catalog?.enforcement_date ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="소관부처">{data.catalog?.ministry ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="조문수">{p?.body.article_count ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="관계수">{p?.relation_stats?.relations_total ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="별표수">{p?.appendices?.length ?? 0}</Descriptions.Item>
        <Descriptions.Item label="버전">
          {(data.versions ?? []).map((v: any) => (
            <Tag key={v.version_uid} color={v.is_current ? "green" : v.is_future ? "gold" : "default"}>
              {v.enforcement_date}{v.is_current ? " (현행)" : v.is_future ? " (예정)" : ""}
            </Tag>
          ))}
        </Descriptions.Item>
      </Descriptions>

      {!p ? (
        <Alert type="info" showIcon message="아직 수집되지 않은 법령입니다." />
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
            <DocViewer articles={filtered} appendices={p.appendices} />
            {p.ordinance_delegations?.length > 0 && (
              <Collapse style={{ marginTop: 16 }} items={p.ordinance_delegations.map((g, i) => ({
                key: String(i),
                label: `${g.source_article_no} — 위임 조례 ${g.ordinance_count}건`,
                children: (
                  <Space direction="vertical" size={2}>
                    {g.ordinances.map((o, j) => (
                      <a key={j} href={o.target_url} target="_blank" rel="noreferrer">{o.target_law_name}</a>
                    ))}
                  </Space>
                ),
              }))} />
            )}
          </div>
        </>
      )}
    </Card>
  );
}
