"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function GovernancePanel() {
  const [paused, setPaused] = useState(false);
  const [writeEnabled, setWriteEnabled] = useState(true);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Control del sistema
      </h2>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-white font-medium mb-2">
            Estado general
          </h3>

          <button
            onClick={() => setPaused(!paused)}
            className={`w-full py-2 rounded-lg text-sm font-medium transition ${
              paused
                ? "bg-red-500 text-white"
                : "bg-emerald-500 text-white"
            }`}
          >
            {paused ? "Sistema pausado" : "Sistema activo"}
          </button>

          <p className="text-xs text-white/50 mt-2">
            Controla si el sistema ejecuta acciones o se mantiene en pausa.
          </p>
        </motion.div>

        <motion.div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-white font-medium mb-2">
            Permisos de operación
          </h3>

          <button
            onClick={() => setWriteEnabled(!writeEnabled)}
            className={`w-full py-2 rounded-lg text-sm font-medium transition ${
              writeEnabled
                ? "bg-cyan-500 text-white"
                : "bg-white/10 text-white/50"
            }`}
          >
            {writeEnabled ? "Operaciones habilitadas" : "Modo seguro"}
          </button>

          <p className="text-xs text-white/50 mt-2">
            Define si el sistema puede realizar cambios o solo visualizar.
          </p>
        </motion.div>
      </div>
    </div>
  );
}