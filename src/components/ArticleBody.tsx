import type { ReactNode } from "react";
import { Tooltip } from "antd";
import type { Article, Relation } from "../api";

// 관계 종류별 색 (법제처 하이퍼링크 느낌)
export const RT_COLOR: Record<string, string> = {
  citation: "#0958d9",      // 인용 — 파랑
  delegation: "#7cb305",    // 위임 — 연두
  internal_ref: "#531dab",  // 자기참조 — 보라
  appendix_ref: "#d46b08",  // 별표참조 — 주황
};
export const RT_LABEL: Record<string, string> = {
  citation: "인용", delegation: "위임", internal_ref: "자기참조", appendix_ref: "별표",
};

interface Tok { text: string; url: string; type: string; title: string; dangling?: boolean }

// 관계 → 인라인 링크 토큰(고유 link_text, 긴 것 우선). link_text 가 본문에 나타나는 위치를 감싼다.
function linkTokens(relations: Relation[]): Tok[] {
  const seen = new Set<string>();
  const toks: Tok[] = [];
  for (const r of relations) {
    const t = (r.link_text || "").trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    toks.push({
      text: t, url: r.target_url, type: r.relation_type,
      title: `[${RT_LABEL[r.relation_type] ?? r.relation_type}] ${r.target_law_name}` +
             (r.target_article_no ? " " + r.target_article_no : "") +
             (r.appendix_dangling ? " · 문서에 없음" : ""),
      dangling: r.appendix_dangling,
    });
  }
  return toks.sort((a, b) => b.text.length - a.text.length); // 긴 토큰 우선(부분매칭 방지)
}

// 텍스트 세그먼트에서 링크 토큰을 <a> 로 감싼다(토큰당 첫 등장 1회). used 는 조문 전체 공유.
function wrapLinks(text: string, toks: Tok[], used: Set<string>, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let buf = "", i = 0, k = 0;
  while (i < text.length) {
    let hit: Tok | null = null;
    for (const tk of toks) {
      if (!used.has(tk.text) && text.startsWith(tk.text, i)) { hit = tk; break; }
    }
    if (hit) {
      if (buf) { out.push(buf); buf = ""; }
      used.add(hit.text);
      const color = hit.dangling ? "#8c8c8c" : (RT_COLOR[hit.type] ?? "#0958d9");
      out.push(
        <Tooltip key={`${keyBase}-a${k++}`} title={hit.title}>
          <a href={hit.url || undefined} target="_blank" rel="noreferrer"
             style={{ color, fontWeight: 600, textDecoration: hit.dangling ? "line-through" : "none",
                      borderBottom: hit.dangling ? "none" : `1px dotted ${color}`, cursor: "pointer" }}>
            {hit.text}
          </a>
        </Tooltip>
      );
      i += hit.text.length;
    } else { buf += text[i]; i++; }
  }
  if (buf) out.push(buf);
  return out;
}

// <개정 ...>·<신설 ...> 등 개정연혁 꼬리표를 흐리게(법제처 스타일)
function dimAmend(nodes: ReactNode[], keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  nodes.forEach((n, idx) => {
    if (typeof n !== "string") { out.push(n); return; }
    n.split(/(<[^>]+>)/g).forEach((p, j) => {
      if (!p) return;
      out.push(/^<[^>]+>$/.test(p)
        ? <span key={`${keyBase}-am${idx}-${j}`} style={{ color: "#adb5bd", fontSize: 13 }}>{p}</span>
        : p);
    });
  });
  return out;
}

export default function ArticleBody({ article }: { article: Article }) {
  const toks = linkTokens(article.relations || []);
  const images = article.images || [];
  const used = new Set<string>();
  const segs = (article.content || "").split("[그림]");
  const nodes: ReactNode[] = [];
  segs.forEach((seg, idx) => {
    nodes.push(...dimAmend(wrapLinks(seg, toks, used, `s${idx}`), `s${idx}`));
    if (idx < segs.length - 1) {
      const img = images[idx];
      nodes.push(
        img
          ? <div key={`img${idx}`} style={{ margin: "10px 0" }}>
              <img src={img.url} alt="본문 그림" loading="lazy"
                   style={{ maxWidth: "100%", border: "1px solid #eee", borderRadius: 6, background: "#fff" }} />
            </div>
          : <span key={`img${idx}`} style={{ color: "#adb5bd" }}>[그림]</span>
      );
    }
  });
  return (
    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.9, fontSize: 15, color: "#1f1f1f",
                  wordBreak: "keep-all" }}>
      {nodes}
    </div>
  );
}
