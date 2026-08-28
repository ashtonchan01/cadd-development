import { useEffect, useRef, useState } from 'react';
import type { AddressCandidate } from '../services/addressSearch';
import { searchAddresses } from '../services/addressSearch';

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (candidate: AddressCandidate) => void;
}) {
  const [suggestions, setSuggestions] = useState<AddressCandidate[]>([]);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleChange(v: string) {
    onChange(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    if (v.trim().length < 4) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      const results = await searchAddresses(v, controller.signal);
      setSuggestions(results);
      setOpen(results.length > 0);
    }, 300);
  }

  return (
    <div className="autocomplete" ref={wrapperRef}>
      <input
        required
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder="Start typing an address…"
        autoComplete="off"
      />
      {open && (
        <ul className="autocomplete-list">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onClick={() => {
                onSelect(s);
                setOpen(false);
              }}
            >
              {s.fullAddress}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
