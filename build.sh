#!/bin/bash
# 把 src/ 里的文件合成一个 index.html（单文件，直接用浏览器打开即可）
cd "$(dirname "$0")"
{
cat <<'HEAD'
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>魔术方块小达人</title>
<meta name="description" content="给小学生的魔术方块教学：7 步学会还原，观察力训练游戏，计时器，冲向 20 秒。">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Noto+Sans+SC:wght@400;500;700&family=ZCOOL+KuaiLe&display=swap">
<style>
HEAD
cat src/style.css
cat <<'MID'
</style>
</head>
<body>
<header class="topbar"><div class="topbar-in">
  <a class="brand" href="#home" aria-label="魔术方块小达人 首页"><span class="logo" aria-hidden="true"><i style="background:#FFD21F"></i><i style="background:#E2302F"></i><i style="background:#14A44D"></i><i style="background:#1F5FE0"></i><i style="background:#FFD21F"></i><i style="background:#FF8A1C"></i><i style="background:#FFFFFF"></i><i style="background:#14A44D"></i><i style="background:#FFD21F"></i></span><b>魔术方块小达人</b></a>
  <nav class="nav" aria-label="主要页面"></nav>
</div></header>
<main id="main"></main>
<script>
MID
sed '/^if (typeof module/d' src/engine.js
cat src/ui.js src/content.js src/pages.js
printf '</script>\n</body>\n</html>\n'
} > index.html
echo "built index.html ($(wc -c < index.html) bytes)"
