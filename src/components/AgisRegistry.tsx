"use client";

import { motion } from "framer-motion";

type AGI = {
  name: string;
  status: "active" | "inactive";
  load: number;
};

const agis: AGI[] = [
  { name: "NOVA", status: "active", load: 72 },
  { name: "Candy Ads", status: "active", load: 55 },
  { name: "PRO IA", status: "active", load: 64 },
  { name: "Nova Ads", status: "inactive", load: 0 },
];

export default function AgisRegistry() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Inteligencias activas
      </h2>

      <div className="space-y-3">
        {agis.map((a, i) => (
          <motion.div
            key={a.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">{a.name}</span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  a.status === "active"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-white/10 text-white/50"
                }`}
              >
                {a.status === "active" ? "Activa" : "Inactiva"}
              </span>
            </div>

            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400"
                style={{ width: `${a.load}%` }}
              />
            </div>

            <div className="text-xs text-white/50 mt-1">
              Carga operativa: {a.load}%
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}