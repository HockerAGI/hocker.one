"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

type Service = {
  name: string;
  description: string;
  status: "online" | "warning" | "offline";
  lastCheck: string;
  url: string;
};

const services: Service[] = [
  {
    name: "NOVA Core",
    description: "Centro de inteligencia que coordina decisiones y procesos.",
    status: "online",
    lastCheck: "Hace 2 min",
    url: "#",
  },
  {
    name: "Node Agent",
    description: "Sistema que ejecuta acciones automáticas en tiempo real.",
    status: "online",
    lastCheck: "Hace 1 min",
    url: "#",
  },
  {
    name: "Audit System",
    description: "Registro y verificación de todas las operaciones.",
    status: "warning",
    lastCheck: "Hace 10 min",
    url: "#",
  },
];

const statusColor = {
  online: "bg-emerald-500",
  warning: "bg-yellow-500",
  offline: "bg-red-500",
};

export default function ExternalServicesSection() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Servicios conectados
      </h2>

      <div className="grid md:grid-cols-2 gap-4">
        {services.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusColor[s.status]}`} />
                <span className="text-white font-medium">{s.name}</span>
              </div>

              <a href={s.url}>
                <ExternalLink className="w-4 h-4 text-white/60 hover:text-white" />
              </a>
            </div>

            <p className="text-sm text-white/70">{s.description}</p>

            <div className="mt-3 text-xs text-white/50">
              Última revisión: {s.lastCheck}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}