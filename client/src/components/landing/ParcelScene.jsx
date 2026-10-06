import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Float, RoundedBox } from '@react-three/drei';

const KRAFT = '#C9A57E';
const KRAFT_DARK = '#B38D63';
const TAPE = '#2F5D4B';
const LABEL = '#FBFBF9';

function Parcel({ position, scale = 1, rotation = [0, 0, 0], color = KRAFT, speed = 1.2 }) {
  return (
    <Float speed={speed} rotationIntensity={0.35} floatIntensity={0.9} floatingRange={[-0.08, 0.08]}>
      <group position={position} rotation={rotation} scale={scale}>
        <RoundedBox args={[1.3, 0.9, 1]} radius={0.06} smoothness={4} castShadow>
          <meshStandardMaterial color={color} roughness={0.85} metalness={0} />
        </RoundedBox>
        {/* tape across the top */}
        <mesh position={[0, 0.452, 0]}>
          <boxGeometry args={[0.26, 0.01, 1.01]} />
          <meshStandardMaterial color={TAPE} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.2, 0.502]}>
          <boxGeometry args={[0.26, 0.5, 0.005]} />
          <meshStandardMaterial color={TAPE} roughness={0.5} />
        </mesh>
        {/* shipping label */}
        <mesh position={[0.36, -0.18, 0.503]}>
          <planeGeometry args={[0.42, 0.28]} />
          <meshStandardMaterial color={LABEL} roughness={0.9} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0.36, -0.12 - i * 0.06, 0.505]}>
            <planeGeometry args={[i === 0 ? 0.3 : 0.22, 0.018]} />
            <meshBasicMaterial color="#26302B" />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function Rig({ children }) {
  const group = useRef();
  useFrame((state, delta) => {
    if (!group.current) return;
    const tx = state.pointer.x * 0.35;
    const ty = state.pointer.y * 0.18;
    group.current.rotation.y += (tx - group.current.rotation.y) * Math.min(1, delta * 2.5);
    group.current.rotation.x += (-ty - group.current.rotation.x) * Math.min(1, delta * 2.5);
  });
  return <group ref={group}>{children}</group>;
}

export default function ParcelScene() {
  const wrap = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '120px' });
    if (wrap.current) io.observe(wrap.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="size-full">
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.6, 6.2], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        aria-label="Floating parcels"
      >
        <ambientLight intensity={0.55} />
        <hemisphereLight args={['#F3F4F0', '#17201C', 0.6]} />
        <directionalLight position={[3, 5, 4]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-4, 2, -2]} intensity={0.4} color="#B9D1C4" />
        <Rig>
          <Parcel position={[-0.9, 0.55, 0]} rotation={[0.15, 0.5, -0.05]} speed={1.1} />
          <Parcel position={[1.05, 0.2, -0.6]} rotation={[-0.1, -0.6, 0.08]} scale={0.82} color={KRAFT_DARK} speed={1.4} />
          <Parcel position={[0.1, -0.85, 0.5]} rotation={[0.05, 0.2, 0.04]} scale={0.7} speed={1.7} />
          <Parcel position={[1.5, 1.35, -1.4]} rotation={[0.3, -0.3, 0.2]} scale={0.48} speed={2} />
        </Rig>
        <ContactShadows position={[0, -1.7, 0]} opacity={0.35} scale={9} blur={2.6} far={3} color="#000000" />
      </Canvas>
    </div>
  );
}
