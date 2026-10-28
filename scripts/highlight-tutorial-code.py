"""Highlight static tutorial code; preserve text and leave prose and custom labs intact.

Run from the project root: python3 scripts/highlight-tutorial-code.py
"""
import html
import json
import re
import subprocess
from pathlib import Path

root = Path('pages')
paths = sorted(root.glob('it/tutorial/*/index.html')) + sorted(root.glob('en/tutorials/*/index.html'))
block_pattern = re.compile(r'(<pre\b[^>]*>\s*<code)([^>]*?)>(.*?)</code>(\s*</pre>)', re.S)
token_tag = re.compile(r"</?span\b(?:\"[^\"]*\"|'[^']*'|[^'\">])*>")
node_script = r'''import Prism from "./src/scripts/pages/tutorials/css-fundamentals/syntax.js";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-markdown.js";
Prism.languages.robots = { comment: /#.*/, property: /^[\w-]+(?=:)/m, value: { pattern: /(:\s*)[^\n]+/, lookbehind: true }, punctuation: /:/ };
Prism.languages.ignore = { comment: /#.*/, value: /[^\s#]+/ };
Prism.languages.insertBefore("bash", "function", { command: /\b(?:git|gh|npm|npx|node|cd)\b/ });
let input = ""; for await (const chunk of process.stdin) input += chunk;
console.log(JSON.stringify(JSON.parse(input).map(({text, language}) =>
  Prism.highlight(text, Prism.languages[language], language))));'''


def language_for(path, attrs, text):
    name = path.parent.name
    existing = re.search(r'\blanguage-([\w-]+)', attrs)
    lang = existing.group(1) if existing else ''
    if lang in ('html', 'markup'):
        return 'markup', lang
    if lang in ('css', 'javascript', 'js', 'bash', 'json', 'markdown', 'robots', 'ignore'):
        return ('javascript' if lang == 'js' else lang), lang
    if lang and lang != 'text':
        return None
    if 'code-tree' in attrs or name in ('ai-sviluppo-solido', 'ai-assisted-development'):
        return None
    stripped = text.lstrip()
    if stripped.startswith('User-agent:'):
        return 'robots', 'robots'
    if stripped.startswith('node_modules/') and name in ('git-pratico-senza-panico', 'git-without-panic'):
        return 'ignore', 'ignore'
    if stripped.startswith('<'):
        return 'markup', 'markup'
    if name in ('git-pratico-senza-panico', 'git-without-panic', 'github-operativo', 'github-in-practice'):
        if re.match(r'(?:git|gh|cd|npm|npx)\b', stripped):
            return 'bash', 'bash'
        if name in ('github-operativo', 'github-in-practice') and stripped.startswith('#'):
            return 'markdown', 'markdown'
        return None
    if lang == 'text':
        return None
    if name in ('javascript-fondamentali', 'javascript-fundamentals', 'browser-devtools'):
        return 'javascript', 'javascript'
    if name in ('npm-vite-struttura-progetto', 'npm-vite-project-structure'):
        return ('json', 'json') if stripped.startswith('{') else ('bash', 'bash')
    if name in ('accessibilita-web-base', 'web-accessibility-basics', 'css-fondamentali', 'css-fundamentals'):
        return 'css', 'syntax-css'
    return None


for path in paths:
    source = path.read_text()
    replacements = []
    items = []
    for match in block_pattern.finditer(source):
        attrs, content = match.group(2), match.group(3)
        # Bespoke interactive markup carries meaning and must not be replaced.
        if '<span' in content and re.search(r'<span(?! class="token\b)', content):
            continue
        clean = token_tag.sub('', content)
        if '<' in clean:
            continue
        text = html.unescape(clean)
        lang = language_for(path, attrs, text)
        if lang is None:
            continue
        grammar, label = lang
        if re.search(r'\blanguage-[\w-]+', attrs):
            attrs = re.sub(r'\blanguage-[\w-]+', f'language-{label}', attrs)
        elif f'class="{label}"' in attrs:
            pass
        elif 'class="' in attrs:
            attrs = attrs.replace('class="', f'class="language-{label} ', 1)
        else:
            attrs += f' class="language-{label}"'
        replacements.append((match, attrs))
        items.append({'text': text, 'language': grammar})
    if not items:
        continue
    output = subprocess.run(['node', '--input-type=module', '-e', node_script],
                            input=json.dumps(items), text=True, capture_output=True, check=True)
    highlighted = json.loads(output.stdout)
    for (match, attrs), result in reversed(list(zip(replacements, highlighted))):
        result = re.sub(r'(?m)^(>{7})', '&gt;' * 7, result)
        replacement = match.group(1) + attrs + '>' + result + '</code>' + match.group(4)
        source = source[:match.start()] + replacement + source[match.end():]
    path.write_text(source)
