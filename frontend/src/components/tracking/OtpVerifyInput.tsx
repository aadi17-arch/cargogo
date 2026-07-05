interface OtpVerifyInputProps {
  type: 'pickup' | 'dropoff';
  otp: string;
  setOtp: (value: string) => void;
  onVerify: () => void;
}

export default function OtpVerifyInput({ type, otp, setOtp, onVerify }: OtpVerifyInputProps) {
  const label = type === 'pickup' ? 'Enter Pickup OTP:' : 'Enter Dropoff OTP:';
  const buttonLabel = type === 'pickup' ? 'Verify Pickup' : 'Verify Dropoff';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <span
        className="font-semibold text-sm"
        style={{ color: 'var(--color-text-main)' }}
      >
        {label}
      </span>
      <div className="flex gap-2">
        <input
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
          className="input-field max-w-[120px] text-center text-lg tracking-widest"
          placeholder="000000"
          style={{ fontFamily: 'var(--font-mono)' }}
        />
        <button
          onClick={onVerify}
          className="text-white px-4 py-2 text-sm font-bold transition"
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
