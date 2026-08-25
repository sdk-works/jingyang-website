import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

const LANGUAGES = [
  { code: 'zh', label: '中文',    flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

export default function Navbar({ transparent = false }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isTransparent = transparent && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const changeLanguage = async (lang) => {
    localStorage.setItem('lang', lang);
    setLangOpen(false);
    await router.push(router.asPath, router.asPath, { locale: lang });
  };

  const activeLangCode = mounted ? (router.locale || i18n?.language || 'zh') : 'zh';
  const activeLang = LANGUAGES.find(l => l.code === activeLangCode) || LANGUAGES[0];

  const navLinks = [
    { href: '/',           label: t('nav.home') },
    { href: '/about',      label: t('nav.about') },
    { href: '/products',   label: t('nav.products') },
    { href: '/cases',      label: t('nav.cases') },
    { href: '/news',       label: t('nav.news') },
    { href: '/calculator', label: t('nav.calculator') },
    { href: '/contact',    label: t('nav.contact') },
  ];

  const navBg = isTransparent ? 'bg-transparent' : 'bg-white/98 backdrop-blur-sm shadow-md';
  const textClr = isTransparent ? 'text-white' : 'text-gray-800';
  const hoverBg = isTransparent ? 'hover:bg-white/15' : 'hover:bg-gray-100';

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">

          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img
              src="/images/logo.jpg"
              alt="京阳温室科技"
              className="h-10 w-auto max-w-[140px] object-contain"
            />
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm ${textClr} ${hoverBg}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div ref={langRef} className="relative">
              {/* ✅ 按钮永远可以点击，没有任何禁用 */}
              <button
                onClick={() => setLangOpen(!langOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm ${textClr} ${hoverBg}`}
              >
                {mounted ? (
                  <>
                    <span>{activeLang.flag}</span>
                    <span className="hidden md:inline">{activeLang.label}</span>
                  </>
                ) : (
                  <span>🌐</span>
                )}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {langOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white shadow-xl rounded-xl overflow-hidden z-50">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => changeLanguage(l.code)}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50"
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/contact"
              className="hidden sm:inline-flex px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 shadow-sm"
            >
              {t('nav.consult')}
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden p-2 rounded-lg ${textClr} ${hoverBg}`}
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg px-4 py-3">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              {link.label}
            </Link>
          ))}
          <Link href="/contact" onClick={() => setMobileOpen(false)}
            className="mt-2 flex justify-center px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl">
            {t('nav.consult')}
          </Link>
        </div>
      )}
    </nav>
  );
}
