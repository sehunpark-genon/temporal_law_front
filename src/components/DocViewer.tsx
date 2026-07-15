import { Tag, Tooltip, Empty } from "antd";
import type { Article, Appendix, Attachment } from "../api";
import ArticleBody, { RT_COLOR, RT_LABEL } from "./ArticleBody";

function Legend() {
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14, fontSize: 12 }}>
      {Object.entries(RT_LABEL).map(([k, v]) => (
        <span key={k} style={{ color: "#666" }}>
          <span style={{ color: RT_COLOR[k], fontWeight: 700, borderBottom: `1px dotted ${RT_COLOR[k]}` }}>가나</span> {v}
        </span>
      ))}
      <span style={{ color: "#666" }}>
        <span style={{ color: "#8c8c8c", textDecoration: "line-through" }}>가나</span> 문서에 없는 별표(dangling)
      </span>
    </div>
  );
}

// 조문 아래 관계 요약 칩 (인라인으로 못 잡힌 것 포함 전량)
function RelSummary({ a }: { a: Article }) {
  if (!a.relations?.length) return null;
  return (
    <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
      {a.relations.map((r, i) => {
        const color = RT_COLOR[r.relation_type] ?? "#888";
        const lbl = `${RT_LABEL[r.relation_type] ?? r.relation_type}: ${r.target_law_name}${r.target_article_no ? " " + r.target_article_no : ""}`;
        return (
          <a key={i} href={r.target_url || undefined} target="_blank" rel="noreferrer">
            <Tag bordered={false} style={{ background: `${color}14`, color, fontSize: 11, margin: 0 }}>
              {r.source_clause && r.source_clause !== a.article_no ? `${r.source_clause} ` : ""}{lbl}
              {r.appendix_dangling ? " ⚠" : ""}
            </Tag>
          </a>
        );
      })}
    </div>
  );
}

function AppendixCard({ b }: { b: Appendix }) {
  const label = `${b.kind || "별표"} ${b.no}${b.branch ? "의" + b.branch : ""}`;
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        <Tag color="orange">{label}</Tag>{b.title || "(제목 없음)"}
        {b.view_url && <a href={b.view_url} target="_blank" rel="noreferrer" style={{ marginLeft: 8, fontSize: 12 }}>별표 열기 ↗</a>}
        {b.enforcement_date && <span style={{ color: "#999", fontSize: 12, marginLeft: 8 }}>시행 {b.enforcement_date}</span>}
      </div>
      {b.is_file_only
        ? <div style={{ color: "#999", fontSize: 13 }}>📄 파일로만 제공</div>
        : (b.content ? <div style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "#333",
                                     maxHeight: 220, overflow: "auto", background: "#fafafa",
                                     padding: 8, borderRadius: 4 }}>{b.content}</div> : null)}
      {(b.files?.length ?? 0) > 0 && (
        <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {b.files!.map((f, i) => (
            <a key={i} href={f.url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
              📎 {f.name || f.kind || "파일"}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DocViewer({
  articles, appendices, attachments,
}: {
  articles: Article[]; appendices?: Appendix[]; attachments?: Attachment[];
}) {
  if (!articles.length) return <Empty description="조문 없음" />;
  return (
    <div>
      <Legend />
      <div style={{ borderTop: "2px solid #1f1f1f" }}>
        {articles.map((a, i) => {
          const prev = articles[i - 1];
          const showChapter = a.chapter && a.chapter !== prev?.chapter;
          return (
            <div key={a.article_no + i}>
              {showChapter && (
                <div style={{ fontWeight: 700, fontSize: 16, color: "#1f1f1f", background: "#f5f7fa",
                              padding: "8px 12px", margin: "18px 0 6px", borderLeft: "3px solid #0958d9" }}>
                  {a.chapter}
                </div>
              )}
              <div style={{ padding: "16px 4px", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: "#0d1a2b" }}>
                  {a.article_no}
                  {a.article_title ? <span style={{ marginLeft: 2 }}>({a.article_title})</span> : ""}
                  {a.enforcement_date ? <Tooltip title={`조문 시행일 ${a.enforcement_date}`}>
                    <Tag bordered={false} color="blue" style={{ marginLeft: 8, fontSize: 11 }}>시행 {a.enforcement_date}</Tag>
                  </Tooltip> : null}
                </div>
                <ArticleBody article={a} />
                <RelSummary a={a} />
              </div>
            </div>
          );
        })}
      </div>

      {(appendices?.length ?? 0) > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 15, margin: "0 0 10px" }}>📑 별표·별지·서식 ({appendices!.length})</div>
          {appendices!.map((b, i) => <AppendixCard key={i} b={b} />)}
        </div>
      )}

      {(attachments?.length ?? 0) > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>📎 첨부파일(전체 원문)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {attachments!.map((f, i) => (
              <a key={i} href={f.url} target="_blank" rel="noreferrer">📎 {f.name || f.url}</a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
