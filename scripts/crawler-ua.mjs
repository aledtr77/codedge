// The user-agent test shared by the two inline head scripts that must behave
// differently for a crawler than for a reader:
//
//   the anti-FOUC flag (vite.config.js)  - a crawler gets no `js` class, so the
//                                          body is never hidden waiting for a
//                                          paint it will not perform;
//   the language preference (i18n-plugin.mjs) - a crawler is never redirected to
//                                          the other language, so every URL
//                                          keeps answering in the language it
//                                          was indexed in.
//
// It lives here so the two cannot drift apart: a name added for one of them is
// added for both. Kept as a pattern string because both consumers embed it in
// the source of an inline script rather than using it directly.
export const CRAWLER_UA_PATTERN = 'bot|google|baidu|bing|msn|duckduck|teoma|slurp|yandex|lighthouse';
