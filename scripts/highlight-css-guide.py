"""Refresh syntax highlighting in both CSS guides after editing code examples.

Run from the project root: python3 scripts/highlight-css-guide.py
The source remains highlighted when JavaScript is disabled.
"""
import html
import json
import re
import subprocess
from pathlib import Path

paths = [
    Path('pages/it/tutorial/css-fondamentali/index.html'),
    Path('pages/en/tutorials/css-fundamentals/index.html'),
]
node_script = '''import Prism from "./src/scripts/pages/tutorials/css-fundamentals/syntax.js";
let input = ""; for await (const chunk of process.stdin) input += chunk;
console.log(JSON.stringify(JSON.parse(input).map(text => {
  const lang = text.trimStart().startsWith("<") ? "markup" : "css";
  return { lang, html: Prism.highlight(text, Prism.languages[lang], lang) };
})));'''
pattern = re.compile(r'<pre><code(?: class="language-(?:markup|css)")?>(.*?)</code></pre>', re.S)
for path in paths:
    source = path.read_text()
    matches = list(pattern.finditer(source))
    examples = [html.unescape(re.sub(r'</?span(?: class="[^"]+")?>', '', match.group(1))) for match in matches]
    result = subprocess.run(
        ['node', '--input-type=module', '-e', node_script],
        input=json.dumps(examples), text=True, capture_output=True, check=True,
    )
    for match, block in reversed(list(zip(matches, json.loads(result.stdout)))):
        source = source[:match.start()] + f'<pre><code class="language-{block["lang"]}">{block["html"]}</code></pre>' + source[match.end():]
    path.write_text(source)
