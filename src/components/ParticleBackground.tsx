import { useEffect, useRef } from 'react';
import { PersonalityMode } from '../types';

interface ParticleBackgroundProps {
  personality: PersonalityMode;
  mood: number;
  effectsEnabled: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  type: 'circle' | 'star' | 'triangle';
}

export const ParticleBackground = ({ personality, mood, effectsEnabled }: ParticleBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      const particleCount = Math.floor((mood / 100) * 50) + 10;
      
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push(createParticle(canvas.width, canvas.height, personality));
      }
    };

    const animate = () => {
      if (!effectsEnabled) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach((particle, index) => {
        updateParticle(particle, canvas.width, canvas.height, mood);
        drawParticle(ctx, particle);
        
        // Remove particles that are too faded
        if (particle.opacity <= 0) {
          particlesRef.current[index] = createParticle(canvas.width, canvas.height, personality);
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    initParticles();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [personality, mood, effectsEnabled]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none opacity-60"
      style={{ zIndex: 1 }}
    />
  );
};

const createParticle = (width: number, height: number, personality: PersonalityMode): Particle => {
  const colors = getPersonalityColors(personality);
  const speed = 0.5 + Math.random() * 1.5;
  
  return {
    x: Math.random() * width,
    y: height + 50,
    vx: (Math.random() - 0.5) * speed,
    vy: -speed * (0.5 + Math.random() * 1.5),
    size: 2 + Math.random() * 4,
    opacity: 0.8 + Math.random() * 0.2,
    color: colors[Math.floor(Math.random() * colors.length)],
    type: ['circle', 'star', 'triangle'][Math.floor(Math.random() * 3)] as 'circle' | 'star' | 'triangle'
  };
};

const updateParticle = (particle: Particle, width: number, height: number, mood: number) => {
  const moodMultiplier = mood / 50;
  
  particle.x += particle.vx * moodMultiplier;
  particle.y += particle.vy * moodMultiplier;
  
  particle.opacity -= 0.002 * moodMultiplier;
  
  // Wrap around edges
  if (particle.x < 0) particle.x = width;
  if (particle.x > width) particle.x = 0;
};

const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
  ctx.save();
  ctx.globalAlpha = particle.opacity;
  ctx.fillStyle = particle.color;
  
  ctx.translate(particle.x, particle.y);
  ctx.rotate(Date.now() * 0.001);
  
  switch (particle.type) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'star':
      drawStar(ctx, particle.size);
      break;
      
    case 'triangle':
      drawTriangle(ctx, particle.size);
      break;
  }
  
  ctx.restore();
};

const drawStar = (ctx: CanvasRenderingContext2D, size: number) => {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const x = Math.cos(angle) * size;
    const y = Math.sin(angle) * size;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
};

const drawTriangle = (ctx: CanvasRenderingContext2D, size: number) => {
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(-size, size);
  ctx.lineTo(size, size);
  ctx.closePath();
  ctx.fill();
};

const getPersonalityColors = (personality: PersonalityMode): string[] => {
  const colorMap = {
    default: ['#8B5CF6', '#A78BFA', '#C4B5FD'],
    roast: ['#F97316', '#FB923C', '#FDBA74'],
    hype: ['#EC4899', '#F472B6', '#F9A8D4'],
    conspiracy: ['#7C3AED', '#8B5CF6', '#A78BFA'],
    motivational: ['#EAB308', '#FACC15', '#FDE047'],
    sleepy: ['#0EA5E9', '#38BDF8', '#7DD3FC']
  };
  
  return colorMap[personality] || colorMap.default;
};