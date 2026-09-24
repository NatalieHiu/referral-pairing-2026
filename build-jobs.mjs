import fs from 'node:fs/promises';
import vm from 'node:vm';
const source = await fs.readFile(new URL('./dist/index.html', import.meta.url), 'utf8');
let section = source.match(/    <section id="jobs">[\s\S]*?<\/section>/)[0];
let script = source.match(/<script>([\s\S]*?)<\/script>/)[1];
const jobs = vm.runInNewContext(script.match(/const jobs = ([\s\S]*?);/)[1]);
for (const asset of new Set([...jobs.map(j => j[4]), 'assets/qr-referral-portal.png'])) {
  const bytes = await fs.readFile(new URL('./dist/' + asset, import.meta.url));
  const data = 'data:image/png;base64,' + bytes.toString('base64');
  section = section.replaceAll(asset, data);
  script = script.replaceAll(asset, data);
}
section = section.replace('06 职位LIST', '职位 LIST');
// Search only job text, excluding embedded image bytes.
script = script.replace("job.join(' ')", "job.slice(0,4).join(' ')");
const css = `
*{box-sizing:border-box}body{margin:0;background:#f4fbfa;color:#173653;font:16px/1.6 "PingFang SC","Microsoft YaHei",sans-serif}.wrap{max-width:1180px;margin:auto;padding:32px 24px}.toolbar{display:flex;justify-content:flex-end;gap:16px;align-items:center;max-width:1180px;margin:20px auto 0;padding:0 24px}.toolbar span{font-size:13px;color:#688092}button{font:inherit;background:#173653;color:white;border:0;border-radius:24px;padding:10px 22px;cursor:pointer}.section-head{display:flex;justify-content:space-between;align-items:center;gap:40px;margin-bottom:24px}.kicker{color:#4c94d6;font-weight:bold}h2{font-size:36px;margin:6px 0}.section-desc{max-width:560px;color:#688092}.jobs-tools{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0}input,select{font:inherit;padding:12px;border:1px solid #dfe5ef;border-radius:10px;background:white;color:#173653}input{flex:1;min-width:220px}.count{align-self:center}.table-wrap{overflow:auto;border:1px solid #dfe5ef;border-radius:16px;background:white}table{width:100%;min-width:760px;border-collapse:collapse}th,td{text-align:left;padding:14px 18px;border-bottom:1px solid #dfe5ef}th{background:#eef3ff;font-size:14px}td{color:#35536b}.dept{font-weight:bold;color:#173653}.tag{background:#eaf0ff;color:#3159be;padding:5px 10px;border-radius:20px;white-space:nowrap;font-size:13px}.job-qr{display:block;width:108px;height:108px;object-fit:contain;background:white}.portal-qr{display:flex;justify-content:center;align-items:center;gap:24px;padding:24px;margin-top:24px;background:white;border:1px solid #dfe5ef;border-radius:16px}.portal-qr img{width:120px;height:120px;object-fit:contain;image-rendering:pixelated}.portal-qr strong,.portal-qr span{display:block}.portal-qr strong{font-size:20px}.portal-qr span{color:#688092}@media(max-width:700px){.section-head{display:block}h2{font-size:28px}.toolbar{flex-wrap:wrap}.wrap{padding:24px 12px}}@media print{@page{size:A4 landscape;margin:12mm}*{print-color-adjust:exact;-webkit-print-color-adjust:exact}body{background:white;font-size:11px}.toolbar,.jobs-tools{display:none!important}.wrap{max-width:none;padding:0}.section-head{display:block;margin-bottom:12px}h2{font-size:24px}.section-desc{max-width:none}.table-wrap{overflow:visible;border-radius:0}table{min-width:0}thead{display:table-header-group}tr,.portal-qr{break-inside:avoid;page-break-inside:avoid}th,td{padding:8px 12px}.job-qr{width:90px;height:90px}.portal-qr img{width:100px;height:100px}}
`;
const printScript = `
document.querySelector('#print').addEventListener('click', async () => {
  const button = document.querySelector('#print');
  button.disabled = true;
  try {
    await Promise.all(Array.from(document.images, img => img.decode()));
    window.print();
  } catch { alert('二维码加载失败，请刷新页面后重试。'); }
  finally { button.disabled = false; }
});`;
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>内部推荐职位列表（扫码查看JD）</title><meta property="og:title" content="内部推荐职位列表（扫码查看JD）"><meta property="og:type" content="website"><meta name="description" content="浏览内部推荐职位，扫描二维码查看职位JD。支持筛选与打印导出PDF。"><meta property="og:description" content="浏览内部推荐职位，扫描二维码查看职位JD。支持筛选与打印导出PDF。"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="内部推荐职位列表（扫码查看JD）"><style>${css}</style></head><body><div class="toolbar"><span>导出当前筛选结果；保留配色请勾选“背景图形”</span><button id="print" type="button">打印 / 导出 PDF</button></div><main>${section}</main><script>${script}\n${printScript}</script></body></html>`;
new vm.Script(script + printScript);
await fs.writeFile(new URL('./dist/jobs.html', import.meta.url), html);
console.log(`Created standalone jobs.html: ${jobs.length} jobs, ${jobs.length + 1} embedded QR images`);
