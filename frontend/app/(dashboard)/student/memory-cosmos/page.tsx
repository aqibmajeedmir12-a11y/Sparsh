'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Float, Html, Line } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Info, Camera, Sparkles, X, ChevronRight, ShieldCheck, Zap } from 'lucide-react';
import * as THREE from 'three';
import { supabase } from '@/lib/supabase';

// --- Data ---
const PLATFORM_COMPARISON = [
  { name: 'Duolingo', lacks: 'Spatial memory mapping & Kinesthetic camera checks' },
  { name: 'Coursera', lacks: 'Real-time interactive retention systems' },
  { name: 'Khan Academy', lacks: '3D visual learning progression' },
  { name: 'Udemy', lacks: 'Non-linear, physics-based concept relationships' },
  { name: 'Quizlet', lacks: 'Physical muscle-memory flashcards' },
  { name: 'Byju\'s', lacks: 'Sensory-inclusive (Deaf/DeafBlind) memory models' },
  { name: 'Lingvano', lacks: 'Macro-visualization of overall fluency' },
  { name: 'SignSchool', lacks: 'Spaced repetition tied to a 3D visual neural net' },
  { name: 'Kahoot!', lacks: 'Personalized, persistent memory degradation tracking' },
  { name: 'ASL App', lacks: 'Real-time AI camera reignition of forgotten signs' }
];

const SEED_NODES = [
  { label: 'Hello', category: 'Greetings', strength: 0.9, position_x: 0, position_y: 0, position_z: 0 },
  { label: 'Thank You', category: 'Greetings', strength: 0.8, position_x: 2, position_y: 1, position_z: -1 },
  { label: 'Please', category: 'Greetings', strength: 0.3, position_x: -2, position_y: -1, position_z: 1 },
  { label: 'Water', category: 'Survival', strength: 0.95, position_x: 1, position_y: 3, position_z: 0 },
  { label: 'Food', category: 'Survival', strength: 0.4, position_x: -1, position_y: 2, position_z: 2 },
  { label: 'Help', category: 'Emergency', strength: 1.0, position_x: 3, position_y: -2, position_z: -2 },
  { label: 'Hurt', category: 'Emergency', strength: 0.2, position_x: -3, position_y: 0, position_z: -3 },
];

// --- 3D Components ---
function MemoryNode({ data, onClick }: { data: any, onClick: (data: any) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isFading = data.strength < 0.5;
  
  // Dynamic pulsing
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      // Fading nodes pulse erratically, strong nodes pulse smoothly
      const pulse = isFading 
        ? Math.sin(t * 5) * 0.1 
        : Math.sin(t * 2) * 0.05;
      meshRef.current.scale.setScalar(1 + pulse);
      
      // Fading nodes drift slowly
      if (isFading) {
        meshRef.current.position.y += Math.sin(t) * 0.002;
        meshRef.current.position.x += Math.cos(t * 0.8) * 0.002;
      }
    }
  });

  const color = isFading ? '#ff3366' : '#00C9A7';
  const size = isFading ? 0.3 : 0.6 * data.strength;

  return (
    <Float speed={isFading ? 3 : 1} rotationIntensity={isFading ? 2 : 0.5} floatIntensity={isFading ? 2 : 0.5}>
      <mesh 
        ref={meshRef} 
        position={[data.position_x, data.position_y, data.position_z]}
        onClick={() => onClick(data)}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={isFading ? 0.2 : data.strength} 
          roughness={0.2}
          metalness={0.8}
        />
        <Html distanceFactor={10} center>
          <div className={`px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap backdrop-blur-md transition-all ${
            isFading ? 'bg-red-500/20 text-red-200 border border-red-500/50' : 'bg-[#00C9A7]/20 text-[#00C9A7] border border-[#00C9A7]/50'
          }`}>
            {data.label}
            {isFading && <span className="block text-[8px] text-red-400 mt-0.5">Fading...</span>}
          </div>
        </Html>
      </mesh>
    </Float>
  );
}

function Connections({ nodes }: { nodes: any[] }) {
  const lines = useMemo(() => {
    const arr = [];
    for(let i=0; i<nodes.length; i++) {
      for(let j=i+1; j<nodes.length; j++) {
        // Connect if same category or close
        if (nodes[i].category === nodes[j].category) {
          arr.push([
            [nodes[i].position_x, nodes[i].position_y, nodes[i].position_z], 
            [nodes[j].position_x, nodes[j].position_y, nodes[j].position_z]
          ]);
        }
      }
    }
    return arr;
  }, [nodes]);

  return (
    <group>
      {lines.map((pts, idx) => (
        <Line 
          key={idx} 
          points={pts as [number, number, number][]} 
          color="#6C63FF" 
          lineWidth={1}
          transparent
          opacity={0.2}
        />
      ))}
    </group>
  );
}

// --- Main Page Component ---
export default function MemoryCosmosPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showInnovation, setShowInnovation] = useState(false);
  const [isReigniting, setIsReigniting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let channel: any;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Fetch nodes
      const { data: existingNodes } = await supabase.from('memory_nodes').select('*').eq('user_id', user.id);
      
      if (!existingNodes || existingNodes.length === 0) {
        // Seed data
        const seedData = SEED_NODES.map(n => ({ ...n, user_id: user.id }));
        const { data: newNodes } = await supabase.from('memory_nodes').insert(seedData).select();
        if (newNodes) setNodes(newNodes);
      } else {
        setNodes(existingNodes);
      }

      // Realtime subscription
      channel = supabase.channel('realtime_memory_nodes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'memory_nodes', filter: `user_id=eq.${user.id}` }, (payload) => {
          if (payload.eventType === 'UPDATE') {
            setNodes(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
            // Update selected node if it's the one that changed
            setSelectedNode((curr: any) => curr && curr.id === payload.new.id ? payload.new : curr);
          } else if (payload.eventType === 'INSERT') {
            setNodes(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'DELETE') {
            setNodes(prev => prev.filter(n => n.id !== payload.old.id));
          }
        })
        .subscribe();
    };
    
    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleNodeClick = (data: any) => {
    setSelectedNode(data);
  };

  const reigniteMemory = async () => {
    if (!selectedNode || !userId) return;
    setIsReigniting(true);
    
    // Simulate camera check and AI verification
    setTimeout(async () => {
      await supabase.from('memory_nodes').update({ 
        strength: 1.0, 
        position_x: selectedNode.position_x * 0.5, 
        position_y: selectedNode.position_y * 0.5, 
        position_z: selectedNode.position_z * 0.5,
        last_practiced: new Date().toISOString()
      }).eq('id', selectedNode.id);
      
      setIsReigniting(false);
      setSelectedNode(null);
    }, 2500);
  };

  return (
    <div className="relative h-[calc(100vh-2rem)] flex flex-col glass-card overflow-hidden">
      
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 flex justify-between items-start pointer-events-none">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Brain className="w-8 h-8 text-[#6C63FF]" />
            Kinesthetic Neural Cosmos
          </h1>
          <p className="text-white/60 mt-2 max-w-xl text-sm">
            A real-time 3D physics map of your muscle memory. Unlike traditional platforms, fading concepts drift into deep space. Reignite them using the AI Camera to pull them back to your core retention.
          </p>
        </div>
        
        <button 
          onClick={() => setShowInnovation(true)}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6C63FF] to-[#00C9A7] rounded-xl text-white text-sm font-bold shadow-lg hover:scale-105 transition-transform"
        >
          <Sparkles className="w-4 h-4" />
          Why is this unique?
        </button>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 w-full h-full bg-[#0B0914] relative">
        <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#6C63FF" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00C9A7" />
          <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
          
          <Connections nodes={nodes} />
          {nodes.map(node => (
            <MemoryNode key={node.id} data={node} onClick={handleNodeClick} />
          ))}
          
          <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.5} maxDistance={15} minDistance={3} />
        </Canvas>
      </div>

      {/* Interaction Modal (Reignite) */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="absolute bottom-8 left-1/2 z-20 w-[400px] glass-card p-6 border border-[#6C63FF]/30"
          >
            <button onClick={() => setSelectedNode(null)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                selectedNode.strength < 0.5 ? 'bg-red-500/20 text-red-500' : 'bg-[#00C9A7]/20 text-[#00C9A7]'
              }`}>
                <Brain className="w-6 h-6" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-white mb-1">"{selectedNode.label}"</h3>
                <p className="text-xs text-white/50 uppercase tracking-wider mb-3">Category: {selectedNode.category}</p>
                
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Memory Strength</span>
                    <span className={selectedNode.strength < 0.5 ? 'text-red-400' : 'text-[#00C9A7]'}>
                      {Math.round(selectedNode.strength * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${selectedNode.strength < 0.5 ? 'bg-red-500' : 'bg-[#00C9A7]'}`}
                      style={{ width: `${selectedNode.strength * 100}%` }}
                    />
                  </div>
                </div>

                {selectedNode.strength < 0.5 ? (
                  <button 
                    onClick={reigniteMemory}
                    disabled={isReigniting}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isReigniting ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Verifying Sign via AI...
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        Reignite Memory via Camera
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-full py-3 bg-white/5 text-white/50 font-semibold rounded-xl flex items-center justify-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#00C9A7]" />
                    Memory Stable
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Innovation Report Slide-over */}
      <AnimatePresence>
        {showInnovation && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end"
            onClick={() => setShowInnovation(false)}
          >
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md h-full bg-[#110f1a] border-l border-white/10 p-6 overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#6C63FF]" />
                  Industry Comparison
                </h2>
                <button onClick={() => setShowInnovation(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#6C63FF]/20 to-[#00C9A7]/10 border border-[#6C63FF]/30 mb-8">
                <h3 className="text-[#00C9A7] font-bold mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> The Sparsh Innovation
                </h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  Traditional platforms rely on flat lists, grids, or linear paths. Sparsh introduces the <strong>Kinesthetic Neural Cosmos</strong>: 
                  A 3D spatial map where fading memories drift away in physical space, and recovering them requires literal muscle-memory checks using AI camera verification.
                </p>
              </div>

              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">What 10 existing platforms lack:</h3>
              <div className="space-y-3">
                {PLATFORM_COMPARISON.map((platform, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
                    <span className="text-white font-bold text-sm">{platform.name}</span>
                    <span className="text-white/50 text-xs flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">✕</span> 
                      Missing: {platform.lacks}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
