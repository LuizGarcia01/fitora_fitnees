import React from "react";

export default function AuthLayout({ icon: _icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/60 via-background to-background flex flex-col">

      {/* Hero brand — centralizado */}
      <div className="flex flex-col items-center pt-14 pb-8 px-4">

        {/* Logo com sombra suave */}
        <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-xl shadow-primary/20 border-2 border-primary/10 mb-5">
          <img
            src="/logo.png"
            alt="Fitora"
            className="w-full h-full object-cover"
            onError={e => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* Nome */}
        <p className="text-3xl font-heading font-bold tracking-[0.18em] text-foreground uppercase leading-none">
          FITORA
        </p>

        {/* Tagline */}
        <p className="text-[11px] text-muted-foreground tracking-[0.22em] uppercase mt-2">
          Treine · Evolua · Conquiste
        </p>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex flex-col items-center px-4 pb-10">
        <div className="w-full max-w-sm">

          {/* Título da tela */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-heading font-bold text-foreground">{title}</h2>
            {subtitle && (
              <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
            )}
          </div>

          {/* Card do formulário */}
          <div className="card-elevated rounded-2xl border border-border p-6">
            {children}
          </div>

          {footer && (
            <p className="text-center text-sm text-muted-foreground mt-5">{footer}</p>
          )}
        </div>
      </div>
    </div>
  );
}
