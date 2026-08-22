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
          className="w-28 h-10 text-center text-base font-bold font-mono tracking-widest bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all text-slate-900"
          placeholder="000000"
          autoFocus
        />
        <button
          onClick={onVerify}
          aria-label={buttonLabel}
          className="h-10 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none cursor-pointer"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
