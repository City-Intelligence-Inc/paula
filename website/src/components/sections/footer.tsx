import Link from "next/link";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  );
}

const socialLinks = [
  { icon: InstagramIcon, href: "https://www.instagram.com/mathitude", label: "Instagram" },
  { icon: FacebookIcon, href: "https://www.facebook.com/mathitude.org/", label: "Facebook" },
  { icon: XIcon, href: "https://x.com/mathitude", label: "X" },
];

const columns = [
  {
    title: "Math engagement",
    links: [
      { label: "Private tutoring", href: "/tutoring/private" },
      { label: "Small group engagement", href: "/tutoring/camps" },
      { label: "All offerings", href: "/tutoring" },
      { label: "Events & News", href: "/events" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Free Resources", href: "/free-resources" },
      { label: "Swamp Puzzles", href: "/swamp-puzzles" },
      { label: "Pascal's Triangle", href: "/pascals-triangle" },
      { label: "Shop Books", href: "/shop" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: "Request a consultation", href: "/contact" },
      { label: "info@mathitude.com", href: "mailto:info@mathitude.com" },
      { label: "510.205.2633", href: "tel:5102052633" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-neutral-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3 group"
            >
              <span
                className="text-3xl font-bold tracking-tight text-white"
                style={{ fontFamily: "var(--font-original-surfer)" }}
              >
                Mathitude
              </span>
            </Link>
            <p className="mt-5 text-white/60 leading-relaxed max-w-sm">
              K-12 math enrichment and tutoring from Mathitude. In Menlo Park
              and anywhere a student wants to learn.
            </p>
            <div className="mt-8 flex gap-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold tracking-[0.18em] text-white/40 uppercase mb-4">
                  {col.title}
                </p>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/80 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} Mathitude LLC. All rights reserved.</p>
          <p>Made with care in Menlo Park, California.</p>
        </div>
      </div>
    </footer>
  );
}
