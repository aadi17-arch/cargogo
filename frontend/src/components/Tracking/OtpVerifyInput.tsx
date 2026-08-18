interface OtpVerifyInputProps {
  type: 'pickup' | 'dropoff';
  otp: string;
  setOtp: (value: string) => void;
  onVerify: () => void;
}

export default function OtpVerifyInput({ type, otp, setOtp, onVerify }: OtpVerifyInputProps) {
  const label = type === 'pickup' ? 'Enter Pickup OTP:' : 'Enter Dropoff OTP:';
  const buttonLabel = type === 'pickup' ? 'Verify Pickup' : 'Verify Dropoff';
  const inputId = `otp-input-${type}`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3" role="group" aria-label={`OTP verification for ${type}`}>
      <label
        htmlFor={inputId}
        className="font-semibold text-sm cursor-pointer"
        style={{ color: 'var(--color-text-main)' }}
      >
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          aria-label={label}
          aria-required="true"
          value={otp}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            setOtp(val);
          }}
          onPaste={(e) => {
            const pasteData = e.clipboardData.getData('text');
            const sanitized = pasteData.replace(/\D/g, '').slice(0, 6);
            setOtp(sanitized);
            e.preventDefault();
          }}
          maxLength={6}
          className="input-field max-w-[120px] text-center text-lg tracking-widest focus:ring-2 focus:ring-slate-900 focus:outline-none"
          placeholder="000000"
          style={{ fontFamily: 'var(--font-mono)' }}
          autoFocus
        />
        <button
          onClick={onVerify}
          aria-label={buttonLabel}
          className="text-white px-4 py-2 text-sm font-bold transition hover:opacity-90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
          style={{
            backgroundColor: 'var(--color-primary)',
            borderRadius: 'var(--radius-button)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
