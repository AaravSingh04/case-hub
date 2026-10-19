'use client';

import React, { useState } from 'react';
import { Copy, Check, Share2, X, MessageSquare, Linkedin } from 'lucide-react';
import { getAppBaseUrl } from '@/lib/utils';

interface ShareModalProps {
  competitionId: string;
  competitionName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({
  competitionId,
  competitionName,
  isOpen,
  onClose,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : getAppBaseUrl();
  const shareUrl = `${baseUrl}/competitions/${competitionId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${competitionName} | Case Hub`,
          text: `Check out ${competitionName} on Case Hub!`,
          url: shareUrl,
        });
      } catch {
        // user cancelled or unsupported
      }
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Check out this competition on Case Hub: ${competitionName} ${shareUrl}`
  )}`;

  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    shareUrl
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-xs">
      <div className="bg-white border border-neutral-border rounded shadow-elevation max-w-md w-full p-6 animate-in fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-border">
          <div className="flex items-center gap-2 text-navy-deep">
            <Share2 className="w-5 h-5 text-brass" />
            <h3 className="font-serif text-lg font-bold text-navy-deep">
              Share Competition
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-muted hover:text-navy-deep">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-xs text-neutral-muted">
            Share this link with your peers or team members.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full px-3 py-2 bg-ivory border border-neutral-border rounded text-xs text-neutral-text font-mono select-all focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="btn-primary text-xs py-2 px-3 whitespace-nowrap"
            >
              {copied ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="pt-3 border-t border-neutral-border grid grid-cols-2 gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-2 flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5 text-academic-success" />
              <span>WhatsApp</span>
            </a>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-2 flex items-center justify-center gap-2"
            >
              <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
              <span>LinkedIn</span>
            </a>
          </div>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="btn-brass w-full text-xs py-2"
            >
              More Share Options
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
