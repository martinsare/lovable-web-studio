import logo from "@/assets/cofund-logo.png.asset.json";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <img src={logo.url} alt="" className="h-8 w-8" />
              <span className="font-display text-lg font-bold">CoFund</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Africa's trusted private investment and business growth ecosystem.
            </p>
          </div>
          <FooterCol title="Platform" items={["Invest", "Raise Capital", "Startup Hub", "Community"]} />
          <FooterCol title="Company" items={["About", "Partners", "Careers", "Press"]} />
          <FooterCol title="Legal" items={["Privacy", "Terms", "Escrow Policy", "Risk Disclosure"]} />
        </div>
        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} CoFund. Together, we grow.
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}