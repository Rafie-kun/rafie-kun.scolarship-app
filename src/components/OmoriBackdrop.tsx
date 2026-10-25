import React from 'react';

/**
 * A quiet, dreamlike backdrop for the sign-in screen.
 * Built entirely from CSS gradients and light motion — no external assets.
 */

const SPARKS = [
  { left: '12%', top: '62%', delay: '0s', duration: '13s' },
  { left: '22%', top: '74%', delay: '1.8s', duration: '11s' },
  { left: '31%', top: '58%', delay: '3.4s', duration: '15s' },
  { left: '42%', top: '80%', delay: '0.9s', duration: '12s' },
  { left: '55%', top: '64%', delay: '4.2s', duration: '14s' },
  { left: '63%', top: '48%', delay: '2.6s', duration: '10s' },
  { left: '72%', top: '70%', delay: '5.4s', duration: '13s' },
  { left: '81%', top: '56%', delay: '1.2s', duration: '16s' },
  { left: '88%', top: '78%', delay: '3.9s', duration: '12s' },
  { left: '48%', top: '38%', delay: '6s', duration: '11s' },
  { left: '17%', top: '42%', delay: '2.2s', duration: '14s' },
  { left: '67%', top: '32%', delay: '0.4s', duration: '15s' },
];

export default function OmoriBackdrop() {
  return (
    <div className="omori-backdrop" aria-hidden="true">
      <div className="omori-stars" />
      <div className="omori-orb" />
      <div className="omori-orb omori-orb--small" />
      {SPARKS.map((spark, index) => (
        <span
          key={index}
          className="omori-spark"
          style={{
            left: spark.left,
            top: spark.top,
            animationDelay: spark.delay,
            animationDuration: spark.duration,
          }}
        />
      ))}
    </div>
  );
}
