import { useLayoutEffect, useRef } from "react";
import { ArrowUp, Mic } from "lucide-react";
import { confirmSound } from "../../lib/heyFeedback";
import { useLocale } from "../../i18n/LocaleContext.jsx";
import VoiceInput from "./VoiceInput.jsx";

export default function ChatInput({
  value,
  setValue,
  onSend,
  disabled = false,
  conversationId = null,
  onSpeaking,
  onVoiceCall,
}) {
  const { t } = useLocale();
  const inputRef = useRef(null);
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (input) { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 220)}px`; }
  }, [value]);

  function handleVoiceTranscript(transcript) {
    if (transcript) {
      setValue((current) => {
        const trimmed = current.trim();
        return trimmed ? `${trimmed} ${transcript}` : transcript;
      });
    }
  }

  function send() {
    if (disabled || !value.trim()) return;
    if (!disabled) confirmSound();
    onSend();
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      width: '100%',
      maxWidth: '800px',
      padding: '0 24px',
    }}>
      {/* Main Input Box - Massive White Card */}
      <div style={{
        width: '100%',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(20, 20, 20, 0.08)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <textarea
          ref={inputRef}
          maxLength={8000}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              send();
            }
          }}
          placeholder="How can HEY help you today?"
          rows={3}
          disabled={disabled}
          aria-label="Message HEY"
          style={{
            width: '100%',
            minHeight: '72px',
            maxHeight: '220px',
            resize: 'none',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: '#141414',
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            lineHeight: '1.5',
            padding: 0,
            '&::placeholder': { color: '#666666' },
          }}
        />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '8px',
          borderTop: '1px solid rgba(20, 20, 20, 0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              onSpeaking={onSpeaking}
              disabled={disabled}
              conversationId={conversationId}
            />
            <button
              type="button"
              onClick={onVoiceCall}
              disabled={disabled}
              aria-label="Voice call HEY"
              title="Voice call"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '9999px',
                border: 'none',
                background: 'rgba(20, 20, 20, 0.05)',
                color: '#666666',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <Mic size={18} />
            </button>
          </div>
          <button
            type="button"
            onClick={send}
            disabled={disabled || !value.trim()}
            aria-label="Send message"
            title="Send message"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: '9999px',
              border: 'none',
              background: value.trim() && !disabled ? '#0f7685' : 'rgba(20, 20, 20, 0.05)',
              color: value.trim() && !disabled ? '#ffffff' : '#666666',
              cursor: value.trim() && !disabled ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s ease, color 0.15s ease, transform 0.15s ease',
              boxShadow: value.trim() && !disabled ? '0 4px 16px rgba(15, 118, 133, 0.3)' : 'none',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </div>

      {/* Suggestion Cards */}
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '800px',
      }}>
        {[
          { icon: 'FilePlus', label: 'Create a new file' },
          { icon: 'Search', label: 'Search the web' },
          { icon: 'CheckSquare', label: 'Do a small todo' },
        ].map((suggestion, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              // TODO: implement these actions
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              border: '1px solid rgba(20, 20, 20, 0.08)',
              borderRadius: '12px',
              background: '#ffffff',
              color: '#141414',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(15, 118, 133, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.03)';
              e.currentTarget.style.borderColor = 'rgba(20, 20, 20, 0.08)';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px' }}>
              {suggestion.icon === 'FilePlus' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
              )}
              {suggestion.icon === 'Search' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              )}
              {suggestion.icon === 'CheckSquare' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"></path>
                  <line x1="3" y1="3" x2="21" y2="21"></line>
                </svg>
              )}
            </span>
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  );
}