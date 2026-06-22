interface AddressSearchInputProps {
  label: string;
  placeholder: string;
  value: string;
  results: any[];
  searching: boolean;
  onChange: (value: string) => void;
  onSearch: () => void;
  onSelect: (result: any) => void;
}

export default function AddressSearchInput({
  label,
  placeholder,
  value,
  results,
  searching,
  onChange,
  onSearch,
  onSelect,
}: AddressSearchInputProps) {
  return (
    <div className="relative">
      <label
        className="block text-[10px] font-extrabold mb-1 tracking-tight uppercase"
        style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}
      >
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field flex-1 tracking-tight"
          style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-body)' }}
        />
        <button
          type="button"
          onClick={onSearch}
          className="text-white px-4 py-3 text-sm font-bold transition whitespace-nowrap shrink-0"
          style={{
            backgroundColor: 'var(--color-primary)',
            borderRadius: 'var(--radius-button)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          Search
        </button>
      </div>

      {searching && (
        <p
          className="text-xs font-medium mt-1"
          style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
        >
          Searching...
        </p>
      )}

      {results.length > 0 && (
        <div
          className="absolute z-[1000] w-full mt-1 max-h-48 overflow-y-auto"
          style={{
            backgroundColor: 'var(--color-card)',
            border: 'var(--border-width) solid var(--color-border)',
            borderRadius: 'var(--radius-card)',
          }}
        >
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(r)}
              className="w-full text-left p-2.5 hover:bg-[var(--color-background)] text-xs border-b last:border-b-0 block truncate"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-main)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
