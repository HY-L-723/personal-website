export function AmbientEffects() {
  return (
    <div className="ambient-effects" aria-hidden="true">
      <div className="rain-layer">
        {Array.from({ length: 34 }, (_, index) => (
          <span
            key={index}
            style={{
              left: ((index * 37) % 101) + '%',
              animationDelay: -((index * 0.37) % 2.8) + 's',
              animationDuration: 1.45 + (index % 7) * 0.12 + 's',
              opacity: 0.22 + (index % 5) * 0.08,
            }}
          />
        ))}
      </div>
      <div className="firefly-layer">
        {Array.from({ length: 12 }, (_, index) => (
          <span
            key={index}
            style={{
              left: ((index * 29 + 7) % 96) + '%',
              top: ((index * 43 + 18) % 82) + '%',
              animationDelay: -((index * 0.71) % 5) + 's',
            }}
          />
        ))}
      </div>
    </div>
  );
}
