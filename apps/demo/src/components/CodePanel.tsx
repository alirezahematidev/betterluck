import { useState } from "react";
import { useI18n } from "../i18n";
import { generateCode } from "../model";
import type { DemoConfig } from "../model";
import { Icon } from "./Icon";

function CopyBlock({ code }: { code: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="code-block">
      <button type="button" className="btn subtle copy-btn" onClick={() => void copy()}>
        <Icon name={copied ? "check" : "copy"} /> {copied ? t.copied : t.copy}
      </button>
      <pre dir="ltr">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function CodePanel({ config }: { config: DemoConfig }) {
  const { t } = useI18n();
  return (
    <div className="panel-stack">
      <p className="hint">{t.codeIntro}</p>
      <CopyBlock code="pnpm add betterluck" />
      <CopyBlock code={generateCode(config)} />
    </div>
  );
}
