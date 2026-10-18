export default function Footer() {
  return (
    <footer className="relative bg-ink dark:bg-night-deep text-canvas overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-g-gradient opacity-60"
      />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 pt-12 sm:pt-16 pb-8 sm:pb-10">
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-14">
          <div>
            <div className="flex items-center gap-2.5 font-body font-bold text-xl mb-3">
              <img
                src="/logo-icon.png?v=9"
                alt="ResumeIQ Logo"
                className="w-7 h-7 rounded-full object-contain opacity-90 border border-white/10"
              />
              <span>Resume<span className="text-gradient">IQ</span></span>
            </div>
            <p className="font-body text-sm text-canvas/60 max-w-xs leading-relaxed">
              Intelligent resume review for people who are more than their formatting.
            </p>
          </div>

          <div className="flex flex-wrap gap-12 sm:gap-16">
            <div>
              <div className="font-ui text-[11px] font-semibold uppercase tracking-widest2 text-canvas/40 mb-4">
                Developer
              </div>
              <div className="space-y-1">
                <div className="font-ui text-sm font-semibold text-canvas">
                  Akshay Sharma
                </div>
                <div className="font-ui text-xs text-canvas/50">
                  Lead Architect
                </div>
              </div>
            </div>
            <div>
              <div className="font-ui text-[11px] font-semibold uppercase tracking-widest2 text-canvas/40 mb-4">
                Product
              </div>
              <ul className="space-y-2.5 font-ui text-sm text-canvas/70">
                <li><a href="#product" className="hover:text-g-blue transition-colors">Features</a></li>
                <li><a href="#process" className="hover:text-g-blue transition-colors">How it works</a></li>
                <li><a href="#dashboard" className="hover:text-g-blue transition-colors">Sample report</a></li>
              </ul>
            </div>
            <div>
              <div className="font-ui text-[11px] font-semibold uppercase tracking-widest2 text-canvas/40 mb-4">
                Get Started
              </div>
              <ul className="space-y-2.5 font-ui text-sm text-canvas/70">
                <li><a href="#upload" className="hover:text-g-blue transition-colors">Analyze a resume</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-canvas/10">
          <div className="font-ui text-[11px] text-canvas/40">&copy; 2026 ResumeIQ. All rights reserved.</div>
          <div className="font-ui text-[10px] tracking-widest2 uppercase text-canvas/30">
            &mdash; Built for people who are more than their formatting &mdash;
          </div>
        </div>
      </div>
    </footer>
  )
}
