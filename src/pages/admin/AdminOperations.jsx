import { useEffect, useState } from "react";
import { Plus, Save, X } from "lucide-react";
import { api } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";

const emptyZone = {
  name: "",
  postalCodes: [],
  deliveryFee: 39,
  minOrder: 150,
  active: true,
};
const emptyOffer = {
  name: "",
  code: "",
  percent: 10,
  minOrder: 0,
  active: false,
  startsAt: "",
  endsAt: "",
};
export default function AdminOperations() {
  const [kind, setKind] = useState("DeliveryZone");
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const { toast } = useToast();
  const load = async () => setRows(await api.entities[kind].list());
  useEffect(() => {
    setForm(null);
    load();
  }, [kind]);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const save = async (e) => {
    e.preventDefault();
    const data = { ...form };
    if (kind === "Offer") {
      data.startsAt = new Date(data.startsAt).toISOString();
      data.endsAt = new Date(data.endsAt).toISOString();
    }
    if (data.id) await api.entities[kind].update(data.id, data);
    else await api.entities[kind].create(data);
    setForm(null);
    await load();
    toast({ title: "Sparat" });
  };
  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Leveranszoner och erbjudanden</h1>
      <div className="flex gap-2">
        {[
          ["DeliveryZone", "Leveranszoner"],
          ["Offer", "Erbjudanden"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setKind(id)}
            className={`px-4 py-2 rounded-full text-sm ${kind === id ? "bg-[#1f5d3a] text-white" : "bg-white"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        onClick={() =>
          setForm({ ...(kind === "DeliveryZone" ? emptyZone : emptyOffer) })
        }
        className="flex gap-2 bg-[#1f5d3a] text-white px-4 py-2 rounded-full"
      >
        <Plus size={18} /> Lägg till
      </button>
      {rows.map((row) => (
        <div
          key={row.id}
          className="bg-white p-4 rounded-2xl flex justify-between gap-3"
        >
          <div>
            <strong>{row.name}</strong>
            <p className="text-sm text-stone-500">
              {kind === "DeliveryZone"
                ? `${row.postalCodes.join(", ")} · ${row.deliveryFee} kr`
                : `${row.code} · ${row.percent}%`}{" "}
              · {row.active ? "Aktiv" : "Dold"}
            </p>
          </div>
          <button
            className="text-[#1f5d3a] font-semibold"
            onClick={() =>
              setForm({
                ...row,
                startsAt: row.startsAt?.slice(0, 16),
                endsAt: row.endsAt?.slice(0, 16),
              })
            }
          >
            Redigera
          </button>
        </div>
      ))}
      {!rows.length && (
        <p className="text-sm text-stone-500">
          Inga poster. Skapa och granska uppgifterna innan de aktiveras.
        </p>
      )}
      {form && (
        <form onSubmit={save} className="bg-white p-5 rounded-2xl space-y-3">
          <button
            type="button"
            className="float-right"
            aria-label="Stäng"
            onClick={() => setForm(null)}
          >
            <X size={18} />
          </button>
          <Field
            label="Namn"
            value={form.name}
            onChange={(v) => set("name", v)}
          />
          {kind === "DeliveryZone" ? (
            <>
              <Field
                label="Postnummer eller tresiffriga prefix, kommaseparerade"
                value={form.postalCodes.join(", ")}
                onChange={(v) =>
                  set("postalCodes", v.replace(/\s/g, "").split(","))
                }
              />
              <Field
                label="Leveransavgift (kr)"
                type="number"
                value={form.deliveryFee}
                onChange={(v) => set("deliveryFee", Number(v))}
              />
              <Field
                label="Minsta beställning (kr)"
                type="number"
                value={form.minOrder}
                onChange={(v) => set("minOrder", Number(v))}
              />
            </>
          ) : (
            <>
              <Field
                label="Rabattkod"
                value={form.code}
                onChange={(v) => set("code", v.toUpperCase())}
              />
              <Field
                label="Rabatt (%)"
                type="number"
                value={form.percent}
                onChange={(v) => set("percent", Number(v))}
              />
              <Field
                label="Minsta beställning (kr)"
                type="number"
                value={form.minOrder}
                onChange={(v) => set("minOrder", Number(v))}
              />
              <Field
                label="Start (lokal tid)"
                type="datetime-local"
                value={form.startsAt}
                onChange={(v) => set("startsAt", v)}
              />
              <Field
                label="Slut (lokal tid)"
                type="datetime-local"
                value={form.endsAt}
                onChange={(v) => set("endsAt", v)}
              />
            </>
          )}
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
            />
            Aktiv
          </label>
          <button className="w-full bg-[#1f5d3a] text-white py-3 rounded-full flex justify-center gap-2">
            <Save size={18} />
            Spara
          </button>
        </form>
      )}
    </div>
  );
}
function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="block text-xs text-stone-500">
      {label}
      <input
        required
        type={type}
        value={value}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full border border-stone-200 rounded-xl p-3 text-sm text-stone-900 mt-1"
      />
    </label>
  );
}
