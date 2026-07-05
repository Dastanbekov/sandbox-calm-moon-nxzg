import React from "react";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";

interface Footer7Props {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  sections?: Array<{
    title: string;
    links: Array<{ name: string; href: string }>;
  }>;
  description?: string;
  socialLinks?: Array<{
    icon: React.ReactElement;
    href: string;
    label: string;
  }>;
  copyright?: string;
  legalLinks?: Array<{
    name: string;
    href: string;
  }>;
}

const defaultSections = [
  {
    title: "Для соискателей",
    links: [
      { name: "Разместить резюме", href: "/resumes/create" },
      { name: "Поиск вакансий", href: "/vacancies" },
      { name: "Обучение и тренинги", href: "/trainings" },
      { name: "Забота о пользователях", href: "/page/care" },
    ],
  },
  {
    title: "Для работодателей",
    links: [
      { name: "Разместить вакансию", href: "/vacancies/create" },
      { name: "Поиск резюме", href: "/resumes" },
      { name: "Каталог компаний", href: "/companies" },
      { name: "Услуги и тарифы", href: "/pricing" },
    ],
  },
  {
    title: "О проекте",
    links: [
      { name: "Реклама на сайте", href: "/page/ad" },
      { name: "Карта сайта", href: "/page/sitemap" },
      { name: "Часто задаваемые вопросы", href: "/page/faq" },
    ],
  },
];

const defaultSocialLinks = [
  { icon: <FaInstagram className="size-5" />, href: "#", label: "Instagram" },
  { icon: <FaFacebook className="size-5" />, href: "#", label: "Facebook" },
  { icon: <FaTwitter className="size-5" />, href: "#", label: "Twitter" },
  { icon: <FaLinkedin className="size-5" />, href: "#", label: "LinkedIn" },
];

const defaultLegalLinks = [
  { name: "Условия использования", href: "/page/rules-vacancy" },
  { name: "Политика конфиденциальности", href: "/page/rules-resume" },
];

export const Footer7 = ({
  logo = {
    url: "/",
    src: "/logo_new.png",
    alt: "Employment.kg",
    title: "Employment.kg",
  },
  sections = defaultSections,
  description = "Платформа для поиска работы и подбора персонала в Кыргызстане. Мы помогаем талантам находить компании, а компаниям — лучших специалистов.",
  socialLinks = defaultSocialLinks,
  copyright = "© 2026 EMPLOYMENT.KG. Все права защищены.",
  legalLinks = defaultLegalLinks,
}: Footer7Props) => {
  return (
    <section className="py-20 bg-slate-900 text-white border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start lg:text-left">
          <div className="flex w-full flex-col justify-between gap-6 lg:items-start">
            {/* Logo — matches header style */}
            <div className="flex items-center gap-2 lg:justify-start">
              <a href={logo.url} className="flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt={logo.alt}
                  className="w-9 h-9 object-contain"
                />
                <span className="text-[19px] font-bold tracking-tight">
                  <span className="text-white">employment.</span><span className="text-[#4452c9]">kg</span>
                </span>
              </a>
            </div>
            <p className="max-w-[70%] text-sm text-white/70 leading-relaxed">
              {description}
            </p>
            <ul className="flex items-center space-x-6 text-white/70">
              {socialLinks.map((social, idx) => (
                <li key={idx} className="font-medium hover:text-white transition-colors">
                  <a href={social.href} aria-label={social.label}>
                    {social.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid w-full gap-6 md:grid-cols-3 lg:gap-20">
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className="mb-4 font-bold text-base text-white">{section.title}</h3>
                <ul className="space-y-3 text-sm text-white/70">
                  {section.links.map((link, linkIdx) => (
                    <li
                      key={linkIdx}
                      className="font-medium hover:text-white transition-colors"
                    >
                      <a href={link.href}>{link.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-white/10 py-8 text-xs font-medium text-white/50 md:flex-row md:items-center md:text-left">
          <p className="order-2 lg:order-1">{copyright}</p>
          <ul className="order-1 flex flex-col gap-2 md:order-2 md:flex-row">
            {legalLinks.map((link, idx) => (
              <li key={idx} className="hover:text-white transition-colors">
                <a href={link.href}> {link.name}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
