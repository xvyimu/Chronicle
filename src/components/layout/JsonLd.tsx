/**
 * JsonLd — 注入一条 JSON-LD 结构化数据。
 *
 * 统一 `application/ld+json` script 标签的写法（nonce + dangerouslySetInnerHTML）。
 * **不做转义**：序列化与 `<` 转义由 `lib/jsonld.ts` 的 `toJsonLd` 负责，
 * 调用方必须传它处理过的字符串。这样安全逻辑单点，本组件只负责标签。
 */
export default function JsonLd({
  data,
  nonce,
}: {
  /** 已由 `toJsonLd` 转义过的 JSON 字符串。 */
  data: string;
  /** CSP nonce（每请求生成，见 lib/csp.ts）。 */
  nonce?: string;
}) {
  return (
    <script
      nonce={nonce}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: data }}
    />
  );
}
