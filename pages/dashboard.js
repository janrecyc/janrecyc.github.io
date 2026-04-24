<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Dashboard - JanRecyc</title>

<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://unpkg.com/@phosphor-icons/web"></script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
body { font-family: 'Prompt', sans-serif; }
.hide-scrollbar::-webkit-scrollbar { display:none; }
</style>
</head>

<body class="bg-[#f8fafc]">

<div id="app"></div>

<script type="module">
import { initApp } from '../js/core/app.js';
import { initDashboardPage } from '../js/modules/dashboard.js';

initApp(initDashboardPage);
</script>

</body>
</html>
