"use client";

import { motion } from "framer-motion";

type Node = {
  id: string;
  status: "online" | "offline";
  lastSeen: string;
};

const nodes: Node[] = [
  { id: "node-01", status: "online", lastSeen: "Hace 1 min" },
  { id: "node-02", status: "online", lastSeen: "Hace 3 min" },
  { id: "node-03", status: "offline", lastSeen: "Hace 1 hr" },
];

export default function NodesPanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Nodos activos
      </h2>

      <div className="space-y-2">
        {nodes.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3"
          >
            <span className="text-white">{n.id}</span>

            <div className="text-right">
              <div
                className={`text-xs ${
                  n.status === "online"
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {n.status === "online" ? "Activo" : "Desconectado"}
              </div>

              <div className="text-xs text-white/50">
                {n.lastSeen}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}