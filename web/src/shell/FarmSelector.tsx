import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronDown, Plus } from 'lucide-react';
import { useFarm } from '../auth/FarmContext';

export function FarmSelector() {
  const { farms, selectedFarm, selectFarm } = useFarm();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  if (!selectedFarm) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        className="flex items-center gap-1 rounded-button border border-border bg-surface-alt px-md py-2 text-sm font-medium text-text-primary hover:brightness-95"
      >
        {selectedFarm.name}
        <ChevronDown size={16} />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-11 z-20 w-64 overflow-hidden rounded-button border border-border bg-surface shadow-lg">
          {farms.map((farm) => (
            <button
              key={farm.id}
              type="button"
              onClick={() => {
                selectFarm(farm.id);
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between px-md py-sm text-left text-sm hover:bg-surface-alt ${
                farm.id === selectedFarm.id ? 'font-semibold text-primary' : 'text-text-primary'
              }`}
            >
              {farm.name}
              <span className="text-[11px] text-text-secondary">{farm.myRole}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              navigate('/fazendas');
            }}
            className="flex w-full items-center gap-1 border-t border-border px-md py-sm text-left text-sm text-primary hover:bg-surface-alt"
          >
            <Plus size={14} /> Gerenciar fazendas
          </button>
        </div>
      ) : null}
    </div>
  );
}
