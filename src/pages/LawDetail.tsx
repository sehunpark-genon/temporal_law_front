import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import {
  Card, Segmented, Descriptions, Tag, Input, Empty, Spin, Space, Typography, Collapse, Alert,
} from "antd";
import type { Relation, Article } from "../api";
import { api } from "../api";

const { Text } = Typography;
const RT_COLOR: Record<string, string> = { delegation: "geekblue", citation: "green", internal_ref: "purple" };

function RelationTag({ r }: { r: Relation }) {
  const label = `${r.relation_type === "delegation" ? (r.delegation_type ?? "위임") : r.relation_type} → ${r.target_law_name}${r.target_article_no ? " " + r.target_article_no : ""}`;
  return (
    <a href={r.target_url} target="_blank" rel="noreferrer" style={{ marginRight: 6 }}>
      <Tag color={RT_COLOR[r.relation_type] ?? "default"} style={{ cursor: "pointer" }}>
        {r.source_clause && <Text type="secondary" style={{ fontSize: 11 }}>{r.source_clause} </Text>}
        {label}
      </Tag>
    </a>
  );
}

function PrettyArticle({ a }: { a: Article }) {
  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        {a.article_no}{a.article_title ? `(${a.article_title})` : ""}
      </div>
      <div style={{ whiteSpace: "pre-wrap", color: "#333", lineHeight: 1.7 }}>{a.content}</div>
      {a.relations?.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {a.relations.map((r, i) => <RelationTag key={i} r={r} />)}
        </div>
      )}
    </div>
  );
}

export default function LawDetail() {
  const { lawId } = useParams();
  const [mode, setMode] = useState("이쁘게 보기");
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
      title={<Space><Link to="/laws">← 목록</Link><span>{data.law_name}</span></Space>}
      extra={<Segmented value={mode} onChange={(v) => setMode(v as string)} options={["이쁘게 보기", "원본(JSON)"]} />}
    >
      <Descriptions size="small" bordered column={4} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="법령ID">{data.law_id}</Descriptions.Item>
        <Descriptions.Item label="MST">{p?.mst ?? data.catalog?.mst ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="시행일">{p?.enforcement_date ?? data.catalog?.enforcement_date ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="상태">
          {data.collected ? <Tag color="green">수집완료</Tag> : <Tag color="gold">미수집</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label="조문수">{p?.body.article_count ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="관계수">{p?.relation_stats?.relations_total ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="조례그룹">{p?.relation_stats?.ordinance_groups ?? 0}</Descriptions.Item>
        <Descriptions.Item label="수집시각">{data.synced_at ? new Date(data.synced_at).toLocaleString("ko-KR") : "-"}</Descriptions.Item>
      </Descriptions>

      {!p ? (
        <Alert type="info" showIcon message="아직 수집되지 않은 법령입니다. (운영 탭에서 backfill 실행)" />
      ) : mode === "원본(JSON)" ? (
        <pre style={{ background: "#0d1117", color: "#c9d1d9", padding: 16, borderRadius: 8,
                      maxHeight: "70vh", overflow: "auto", fontSize: 12 }}>
          {JSON.stringify(p, null, 2)}
        </pre>
      ) : (
        <>
          <Input.Search allowClear placeholder="조문 내용 검색(조번호·제목·본문)" style={{ maxWidth: 360, marginBottom: 12 }}
            onChange={(e) => setQ(e.target.value)} />
          <div style={{ maxHeight: "68vh", overflow: "auto" }}>
            {filtered.map((a, i) => {
              const prev = filtered[i - 1];
              const showChapter = a.chapter && a.chapter !== prev?.chapter;
              return (
                <div key={a.article_no + i}>
                  {showChapter && <div style={{ fontWeight: 700, marginTop: 16, color: "#1677ff" }}>{a.chapter}</div>}
                  <PrettyArticle a={a} />
                </div>
              );
            })}
            {filtered.length === 0 && <Empty description="검색 결과 없음" />}
          </div>

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
        </>
      )}
    </Card>
  );
}
