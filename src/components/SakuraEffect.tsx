/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";

interface SeededPetal {
  id: number;
  left: string;
  size: string;
  delayClass: string;
  topInit: string;
}

export default function SakuraEffect() {
  const [petals, setPetals] = useState<SeededPetal[]>([]);

  useEffect(() => {
    // Generate organic positions for petals
    const newPetals = Array.from({ length: 18 }).map((_, i) => {
      const sizes = ["w-2 h-3", "w-3 h-4", "w-2.5 h-3.5", "w-1.5 h-2.5"];
      const delays = [
        "sakura-delay-0",
        "sakura-delay-1",
        "sakura-delay-2",
        "sakura-delay-3",
        "sakura-delay-4",
        "sakura-delay-5"
      ];
      
      return {
        id: i,
        left: `${Math.random() * 95}%`,
        size: sizes[Math.floor(Math.random() * sizes.length)],
        delayClass: delays[i % delays.length],
        topInit: `-${Math.random() * 20}px`
      };
    });
    setPetals(newPetals);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10" id="sakura-container">
      {petals.map((petal) => (
        <div
          key={petal.id}
          className={`sakura-petal absolute ${petal.size} ${petal.delayClass}`}
          style={{
            left: petal.left,
            top: petal.topInit,
          }}
        />
      ))}
    </div>
  );
}
