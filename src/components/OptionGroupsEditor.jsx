import { Plus, Trash2 } from "lucide-react";
export default function OptionGroupsEditor({ value, onChange }) {
  const update = (index, patch) =>
    onChange(value.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  const option = (index, idx, patch) =>
    update(index, {
      options: value[index].options.map((o, i) =>
        i === idx ? { ...o, ...patch } : o,
      ),
    });
  return (
    <section className="space-y-3 border-t pt-3">
      <h4 className="font-semibold text-sm">Storlekar och tillval</h4>
      {value.map((group, index) => (
        <div key={group.id} className="rounded-xl border p-3 space-y-2">
          <div className="flex justify-between">
            <strong className="text-xs">Grupp {index + 1}</strong>
            <button
              type="button"
              aria-label={`Ta bort grupp ${index + 1}`}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              <Trash2 size={15} />
            </button>
          </div>
          <label className="block text-xs">
            Gruppnamn
            <input
              aria-label={`Gruppnamn ${index + 1}`}
              className="w-full border rounded-lg p-2 mt-1"
              value={group.name}
              onChange={(e) => update(index, { name: e.target.value })}
            />
          </label>
          <label className="block text-xs">
            Typ
            <select
              className="w-full border rounded-lg p-2 mt-1"
              value={group.type}
              onChange={(e) => update(index, { type: e.target.value })}
            >
              <option value="size">Storlek</option>
              <option value="extras">Extra ingredienser</option>
              <option value="sauces">Såser</option>
              <option value="remove">Ta bort ingredienser</option>
            </select>
          </label>
          <div className="flex flex-wrap gap-3 text-xs">
            <label>
              <input
                type="checkbox"
                checked={group.required}
                onChange={(e) => update(index, { required: e.target.checked })}
              />{" "}
              Obligatoriskt
            </label>
            <label>
              <input
                type="checkbox"
                checked={group.multiple}
                disabled={group.type === "size"}
                onChange={(e) => update(index, { multiple: e.target.checked })}
              />{" "}
              Flera val
            </label>
          </div>
          {group.options.map((o, idx) => (
            <div key={idx} className="flex items-end gap-2">
              <label className="flex-1 text-xs min-w-0">
                Alternativ
                <input
                  className="w-full border rounded-lg p-2 mt-1"
                  value={o.name}
                  onChange={(e) => option(index, idx, { name: e.target.value })}
                />
              </label>
              <label className="w-24 text-xs">
                Tillägg (kr)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border rounded-lg p-2 mt-1"
                  value={o.price}
                  onChange={(e) =>
                    option(index, idx, { price: Number(e.target.value) })
                  }
                />
              </label>
              <button
                type="button"
                className="p-2"
                aria-label={`Ta bort alternativ ${idx + 1}`}
                onClick={() =>
                  update(index, {
                    options: group.options.filter((_, i) => i !== idx),
                  })
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-xs text-[#1f5d3a]"
            onClick={() =>
              update(index, {
                options: [...group.options, { name: "", price: 0 }],
              })
            }
          >
            + Alternativ
          </button>
        </div>
      ))}
      <button
        type="button"
        className="flex items-center gap-1 text-sm text-[#1f5d3a]"
        onClick={() =>
          onChange([
            ...value,
            {
              id: crypto.randomUUID(),
              name: "",
              type: "extras",
              required: false,
              multiple: true,
              options: [{ name: "", price: 0 }],
            },
          ])
        }
      >
        <Plus size={16} /> Lägg till tillvalsgrupp
      </button>
    </section>
  );
}
