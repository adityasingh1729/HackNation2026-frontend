const AIWaveform = () => {
  const bars = [0.3, 0.6, 1, 0.7, 0.4, 0.8, 0.5, 0.9, 0.6, 0.4];

  return (
    <div className="flex items-center gap-0.5 h-5">
      {bars.map((scale, index) => (
        <div
          key={index}
          className="w-0.5 bg-primary rounded-full animate-waveform"
          style={{
            height: `${scale * 100}%`,
            animationDelay: `${index * 0.1}s`,
            animationDuration: `${0.8 + Math.random() * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
};

export default AIWaveform;
