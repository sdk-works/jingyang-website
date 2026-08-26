import { useEffect, useState } from 'react';
import axios from 'axios';

const LABELS = { pending:'待翻译', processing:'翻译中', success:'已完成', failed:'失败', waiting_config:'等待配置' };

export default function TranslationPanel({ entityType, auth }) {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    try { setStatus((await axios.get('/api/admin/translations/status', { headers:auth() })).data); } catch {}
  };
  useEffect(() => { load(); const timer=setInterval(load,10000); return()=>clearInterval(timer); }, []);
  const backfill = async () => {
    if (!confirm('只为缺失、失败或中文已更新的内容创建翻译任务；已有成功译文不会重复翻译。是否继续？')) return;
    setBusy(true);
    try {
      const { data } = await axios.post('/api/admin/translations/backfill', { entity_type:entityType }, { headers:auth() });
      alert(data.count ? `已创建 ${data.count} 个缺失或待更新的语言任务` : '没有需要补译的内容');
      await load();
    } catch (e) { alert(e.response?.data?.error || '创建翻译任务失败'); }
    setBusy(false);
  };
  const rows = status?.data?.filter(x => x.entity_type === entityType) || [];
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs">
      <span className="font-semibold text-blue-800">🌐 自动翻译</span>
      <span className={status?.configured ? 'text-green-700' : 'text-orange-700'}>
        {status?.configured ? '翻译服务已连接' : '翻译服务未配置，任务会安全保留'}
      </span>
      {rows.map(x => <span key={x.status} className="rounded-full bg-white px-2 py-1 text-gray-600">{LABELS[x.status] || x.status}: {x.count}</span>)}
      <button onClick={backfill} disabled={busy} className="ml-auto rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white disabled:opacity-50">
        {busy ? '处理中...' : '补译缺失内容'}
      </button>
    </div>
  );
}
