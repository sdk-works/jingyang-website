import { useState } from 'react';

const LANGS = [{id:'en',label:'English'},{id:'ru',label:'Русский'},{id:'ar',label:'العربية'}];

export default function TranslationEditor({ value = {}, onChange, fields }) {
  const [lang, setLang] = useState('en');
  const current = value[lang] || {};
  const set = (key, next) => onChange({ ...value, [lang]:{ ...current, [key]:next } });
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="font-semibold text-gray-800">🌐 外语译文人工校对</div>
        <div className="flex gap-1">{LANGS.map(x => <button type="button" key={x.id} onClick={()=>setLang(x.id)}
          className={`rounded-lg px-2.5 py-1 text-xs ${lang===x.id?'bg-blue-600 text-white':'bg-white text-gray-600'}`}>{x.label}</button>)}</div>
      </div>
      <div className="space-y-3" dir={lang==='ar'?'rtl':'ltr'}>
        {fields.map(field => <div key={field.key}>
          <label className="mb-1 block text-xs font-semibold text-gray-600">{field.label}</label>
          {field.multiline ? <textarea rows={field.rows||3} value={current[field.key]||''} onChange={e=>set(field.key,e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"/>
          : <input value={current[field.key]||''} onChange={e=>set(field.key,e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"/>}
        </div>)}
      </div>
      <label className="mt-3 flex items-center gap-2 text-xs text-gray-700">
        <input type="checkbox" checked={Boolean(current.is_locked)} onChange={e=>set('is_locked',e.target.checked)} className="accent-blue-600"/>
        锁定该语言的人工译文，后续自动翻译不得覆盖
      </label>
    </div>
  );
}
