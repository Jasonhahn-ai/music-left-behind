"use client";

import { useState, useTransition, type ReactNode } from "react";
import { agreeToUploadTerms } from "./agreement-actions";
import { AgreementModal } from "./agreement-modal";

export function UploadGate({
  hasAgreed,
  children,
}: {
  hasAgreed: boolean;
  children: ReactNode;
}) {
  const [agreed, setAgreed] = useState(hasAgreed);
  const [modalOpen, setModalOpen] = useState(!hasAgreed);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAgree() {
    setError(null);
    startTransition(async () => {
      const result = await agreeToUploadTerms();
      if (result.error) {
        setError(result.error);
        return;
      }
      setAgreed(true);
      setModalOpen(false);
    });
  }

  return (
    <div className="relative w-full max-w-lg">
      <div className="relative">
        <div
          inert={!agreed}
          className={agreed ? undefined : "pointer-events-none opacity-40 blur-[1px]"}
        >
          {children}
        </div>
        {!agreed && (
          <button
            type="button"
            aria-label="Read the upload agreement before continuing"
            onClick={() => setModalOpen(true)}
            className="absolute inset-0 z-10 cursor-not-allowed rounded-2xl"
          />
        )}
      </div>

      {modalOpen && (
        <AgreementModal
          pending={pending}
          error={error}
          onAgree={handleAgree}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
