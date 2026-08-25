import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ContactForm() {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const [form, setForm] = useState({
    name: '', country: '', phone: '', email: '',
    greenhouse_type: '', area: '', message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error('请填写姓名');
    setLoading(true);
    try {
      await axios.post('/api/contact', form);
      toast.success(t('contact.success'));
      setForm({ name: '', country: '', phone: '', email: '', greenhouse_type: '', area: '', message: '' });
    } catch (err) {
      toast.error(t('contact.error'));
    } finally {
      setLoading(false);
    }
  };

  const types = ['glass', 'film', 'pc', 'multi-span', 'smart'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
      {/* Contact Info */}
      <div className="space-y-8">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">联系信息</h3>
          <div className="space-y-5">
            {[
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />,
                label: t('contact.address_label'),
                value: '山东省青岛市城阳区春阳路88号',
                sub: 'No.88 Chunyang Road, Qingdao, China'
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />,
                label: t('contact.phone_label'),
                value: '+86-532-8888-8888',
                link: 'tel:+8653288888888'
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
                label: t('contact.email_label'),
                value: 'info@jingyang-greenhouse.com',
                link: 'mailto:info@jingyang-greenhouse.com'
              }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {item.icon}
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">{item.label}</div>
                  {item.link ? (
                    <a href={item.link} className="font-semibold text-gray-800 hover:text-primary-600 transition-colors">{item.value}</a>
                  ) : (
                    <div>
                      <div className="font-semibold text-gray-800">{item.value}</div>
                      {item.sub && <div className="text-sm text-gray-500">{item.sub}</div>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp button */}
        <a
          href="https://wa.me/8613888888888"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-6 py-4 bg-[#25D366] text-white rounded-2xl font-semibold hover:opacity-90 transition-opacity w-full justify-center shadow-lg shadow-green-500/20"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {t('contact.whatsapp')}
        </a>
      </div>

      {/* Form */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('contact.submit')}</h3>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('contact.name')} *</label>
              <input name="name" value={form.name} onChange={handleChange} className="form-input" placeholder="张三 / John Smith" />
            </div>
            <div>
              <label className="form-label">{t('contact.country')}</label>
              <input name="country" value={form.country} onChange={handleChange} className="form-input" placeholder="中国 / China" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('contact.phone')}</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="form-input" placeholder="+86 xxx xxxx xxxx" />
            </div>
            <div>
              <label className="form-label">{t('contact.email')}</label>
              <input name="email" value={form.email} onChange={handleChange} className="form-input" type="email" placeholder="email@example.com" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('contact.greenhouse_type')}</label>
              <select name="greenhouse_type" value={form.greenhouse_type} onChange={handleChange} className="form-input">
                <option value="">{t('common.select_type')}</option>
                {['glass', 'film', 'pc', 'multi-span', 'smart'].map(type => (
                  <option key={type} value={type}>{t(`products.categories.${type}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">{t('contact.area')}</label>
              <input name="area" value={form.area} onChange={handleChange} className="form-input" type="number" placeholder="1000" min="0" />
            </div>
          </div>
          <div>
            <label className="form-label">{t('contact.message')}</label>
            <textarea name="message" value={form.message} onChange={handleChange} rows={4} className="form-input resize-none" placeholder="请描述您的需求..." />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                {t('contact.submitting')}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {t('contact.submit')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
