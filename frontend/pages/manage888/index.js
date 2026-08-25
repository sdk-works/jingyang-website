/**
 * 后台登录页 /admin
 * 修复：密码可视切换按钮 + 正确跳转后台 + 环境变量API地址
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';

export default function AdminLogin() {
  const router = useRouter();
  const [form,     setForm]     = useState({ username: 'admin', password: '' });
  const [status,   setStatus]   = useState('idle');
  const [error,    setError]    = useState('');
  const [showPass, setShowPass] = useState(false);

  // 🔥 这里读取后端地址
  const API = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (Date.now() < payload.exp * 1000) router.push('/manage888/dashboard');
        else localStorage.removeItem('admin_token');
      } catch { localStorage.removeItem('admin_token'); }
    }
  }, []);

  const handleLogin = async () => {
    if (!form.username || !form.password) { setError('请填写用户名和密码'); return; }
    setStatus('loading'); setError('');
    try {
      // 🔥 这里直接用完整地址
      const { data } = await axios.post(`${API}/api/admin/login`, form);
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      router.push('/manage888/dashboard');
    } catch (err) {
      setStatus('idle');
      setError(err.response?.data?.error || '登录失败，请检查用户名和密码');
    }
  };

  const handleKey = e => { if (e.key === 'Enter') handleLogin(); };

  const inputStyle = {
    width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb',
    borderRadius: 10, fontSize: 14, boxSizing: 'border-box', outline: 'none',
    transition: 'border-color .2s, box-shadow .2s', background: '#fafafa',
  };

  return (
    <>
      <Head>
        <title>管理员登录 - 京阳温室后台</title>
        <meta name="robots" content="noindex,nofollow"/>
      </Head>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg,#1a3d2b 0%,#2d6a4f 50%,#1a3d2b 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, background: 'rgba(255,255,255,.15)',
              borderRadius: 18, display: 'inline-flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 32, marginBottom: 12,
              border: '1px solid rgba(255,255,255,.2)'
            }}>🌿</div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>京阳温室科技</div>
            <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 13, marginTop: 4 }}>管理后台</div>
          </div>

          <div style={{ background: '#fff', borderRadius: 18, padding: '32px', boxShadow: '0 24px 60px rgba(0,0,0,.25)' }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a3d2b', marginBottom: 6, textAlign: 'center' }}>欢迎登录</h1>
            <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', marginBottom: 28 }}>请输入管理员账号和密码</p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 6 }}>用户名</label>
              <input
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                onKeyDown={handleKey}
                placeholder="请输入用户名"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#2d6a4f'; e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>密码</label>
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    fontSize: 12, color: '#6b7280', background: 'none', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0
                  }}
                >
                  {showPass ? (
                    <>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      </svg>
                      隐藏密码
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                      显示密码
                    </>
                  )}
                </button>
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                onKeyDown={handleKey}
                placeholder="请输入登录密码"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#2d6a4f'; e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', background: '#fff1f2', border: '1px solid #fecaca',
                borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={status === 'loading'}
              style={{
                width: '100%', padding: '13px',
                background: status === 'loading' ? '#9ca3af' : 'linear-gradient(135deg,#2d6a4f,#1a3d2b)',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 15, fontWeight: 700,
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                transition: 'opacity .2s', letterSpacing: '.5px',
              }}
            >
              {status === 'loading' ? '登录中...' : '登录管理后台'}
            </button>

            <div style={{
              marginTop: 20, padding: '12px 14px', background: '#f0fdf4',
              borderRadius: 8, fontSize: 12, color: '#166534', textAlign: 'center',
              border: '1px solid #bbf7d0'
            }}>
              默认管理员：<strong>admin</strong>，如忘记密码请联系技术支持
            </div>
          </div>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.35)', fontSize: 12, marginTop: 20 }}>
            © {new Date().getFullYear()} 山东京阳温室科技有限公司
          </p>
        </div>
      </div>
    </>
  );
}
