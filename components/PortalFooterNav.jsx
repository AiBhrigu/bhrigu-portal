import React from "react";

export default function PortalFooterNav({
  termsHref = "/faq",
  nextItems = [],
}) {
  const items = Array.isArray(nextItems) ? nextItems.filter(Boolean) : [];
  return (
    <div data-portal-footernav="v0.1" className="portalFooterNav">
      <div className="line">
        If you need terms: <a href={termsHref}>/faq</a>.
      </div>
      {items.length > 0 ? (
        <div className="line">
          Next:{" "}
          {items.map((it, idx) => (
            <React.Fragment key={(it && it.href) || idx}>
              <a href={it.href}>{it.label || it.href}</a>
              {idx < items.length - 1 ? (idx === items.length - 2 ? " or " : ", ") : ""}
            </React.Fragment>
          ))}
          .
        </div>
      ) : null}
      <style jsx>{`
        .portalFooterNav {
          margin: 48px 0 0;
          padding: 18px 20px;
          border: 1px solid rgba(255, 214, 102, 0.18);
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.25);
          max-width: 720px;
        }
        .line {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
            monospace;
          font-size: 14px;
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.78);
          margin: 0;
        }
        .line + .line {
          margin-top: 6px;
        }
        a {
          color: rgba(255, 214, 102, 0.92);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        a:hover {
          color: rgba(255, 214, 102, 1);
        }
      `}</style>
    </div>
  );
}
