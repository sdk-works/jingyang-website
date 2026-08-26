/**
 * 后台统一布局
 * 修复：增加 authorized 状态，token 验证通过前不渲染任何内容，防止未登录直接访问
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';

// 🔥🔥🔥 所有路径全部修复为 /manage888/xxx
const MENU = [
  { href:'/manage888/dashboard', icon:'📊', label:'控制台' },
  { href:'/manage888/contacts',  icon:'📨', label:'咨询管理' },
  { href:'/manage888/products',  icon:'🏗️', label:'产品管理' },
  { href:'/manage888/cases',     icon:'🗂️', label:'案例管理' },
  { href:'/manage888/articles',  icon:'📰', label:'内容管理' },
  { href:'/manage888/users',     icon:'👥', label:'账号权限' },
  { href:'/manage888/settings',  icon:'⚙️', label:'系统设置' },
  { href:'/manage888/audit-logs', icon:'📋', label:'操作日志' },
];

export default function AdminLayout({ children, title = '管理后台' }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (window.innerWidth < 768) setCollapsed(true);
    const token = localStorage.getItem('admin_token');
    if (!token) { router.replace('/manage888'); return; } // 🔥 修复登录页
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      if (Date.now() > exp) {
        localStorage.removeItem('admin_token');
        router.replace('/manage888'); // 🔥 修复
        return;
      }
      setUser({ username: payload.username, role: payload.role, id: payload.userId });
      setAuthorized(true);
    } catch {
      localStorage.removeItem('admin_token');
      router.replace('/manage888'); // 🔥 修复
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/manage888'); // 🔥 修复
  };

  if (!authorized) {
    return (
      <>
        <Head><title>验证中... - 京阳温室后台</title></Head>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white/60">
            <div className="text-3xl mb-3 animate-pulse">🌿</div>
            <p className="text-sm">身份验证中...</p>
          </div>
        </div>
      </>
    );
  }

  const roleLabel = { superadmin:'超级管理员', admin:'管理员', editor:'编辑员', viewer:'只读' };

  return (
    <>
      <Head>
        <title>{title} - 京阳温室后台</title>
        <meta name="robots" content="noindex,nofollow"/>
      </Head>

      <div className="min-h-screen bg-gray-50 flex">
        <aside className={`fixed top-0 left-0 h-full bg-gray-900 text-white flex flex-col transition-all duration-300 z-40 ${collapsed ? 'w-16' : 'w-56'}`}>
          <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 flex-shrink-0">
            {!collapsed && (
              <div>
                <div className="text-sm font-bold text-white leading-tight">京阳温室</div>
                <div className="text-[10px] text-white/40">管理后台</div>
              </div>
            )}
            <button onClick={() => setCollapsed(v => !v)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
            >
              {collapsed
                ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              }
            </button>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {MENU.map(item => {
              const active = router.pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  title={collapsed ? item.label : ''}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active ? 'bg-primary-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {user && (
            <div className="px-3 py-4 border-t border-white/10 flex-shrink-0">
              {!collapsed && (
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {(user.username || 'A').slice(0,1).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-medium text-white truncate">{user.username}</div>
                    <div className="text-[10px] text-white/40">{roleLabel[user.role] || user.role}</div>
                  </div>
                </div>
              )}
              <button onClick={logout}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? '退出登录' : ''}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                {!collapsed && <span>退出登录</span>}
              </button>
            </div>
          )}
        </aside>

        <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-56'} min-h-screen`}>
          <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-3 sm:px-6">
            <h1 className="text-base font-bold text-gray-900">{title}</h1>
            <Link href="/" target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              查看前台
            </Link>
          </header>
          <div className="p-3 sm:p-6 min-w-0">{children}</div>
        </main>
      </div>
    </>
  );
}
