import type { Space } from '@/lib/types';
import { Select } from '@/components/ui/select';

export function SpacePicker({
  spaces,
  value,
  onChange,
}: {
  spaces: Space[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <Select
      containerClassName="w-[200px]"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Пространство"
    >
      {spaces.map((space) => (
        <option key={space.id} value={space.id}>
          {space.name}
        </option>
      ))}
    </Select>
  );
}
