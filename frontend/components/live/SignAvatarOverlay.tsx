'use client';
/**
 * SignAvatarOverlay — Premium Procedural ISL Avatar
 *
 * Anatomy (world Y coords, root at 0):
 *   Pelvis/waist    y ≈ -0.05
 *   Chest center    y ≈  0.25
 *   Shoulder line   y ≈  0.48
 *   Neck base       y ≈  0.52
 *   Head center     y ≈  0.80
 *   Head top        y ≈  1.00
 *
 * Camera: pos=[0, 0.70, 1.65], lookAt=[0, 0.45, 0], fov=44
 *   → sees from y≈−0.20 to y≈1.10 → perfect bust shot
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { resolveSign, resolveToken, SIGN_POSES } from '@/lib/isl/signMap';
import type { BoneRotation } from '@/lib/isl/signPoses';

export interface SignAvatarOverlayProps {
  queue: string[];
  onSignComplete: (word: string) => void;
  avatarUrl?: string;
  className?: string;
  isProcessing?: boolean;
}

// ── Slerp — snappy, readable animation ──────────────────────────
function slerp(obj: THREE.Object3D, rot: BoneRotation, a: number) {
  // clamp alpha to [0,1], use smoothstep, then move 35% toward target per call
  const t = Math.min(Math.max(a, 0), 1);
  const smooth = t * t * (3 - 2 * t);
  obj.quaternion.slerp(
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rot.x, rot.y, rot.z, 'XYZ')),
    Math.min(smooth * 0.35 + 0.08, 1)
  );
}

// ── Materials ─────────────────────────────────────────────────────
function useMat() {
  return useMemo(() => {
    // Premium human-like skin using MeshPhysicalMaterial
    const skinMat = (c: string, r = 0.45) =>
      new THREE.MeshPhysicalMaterial({ 
        color: c, 
        roughness: r, 
        metalness: 0.1, 
        clearcoat: 0.1, 
        clearcoatRoughness: 0.4,
        envMapIntensity: 1.2
      });
      
    const clothMat = (c: string, r = 0.8) =>
      new THREE.MeshStandardMaterial({ color: c, roughness: r, envMapIntensity: 0.8 });

    return {
      skin:    skinMat('#D4A373'),   // warm natural skin tone
      skinLt:  skinMat('#E6B88A'),   // lighter skin for highlights
      shirt:   clothMat('#6C63FF', 0.9),  // premium purple fabric
      accent:  clothMat('#00C9A7', 0.5),  // teal accent
      pants:   clothMat('#1E1B4B', 0.95), // deep navy
      shoe:    clothMat('#0A0A12', 0.5),
      hair:    new THREE.MeshStandardMaterial({ color: '#2B1B17', roughness: 0.6, metalness: 0.1 }), // textured hair
      eyeW:    new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.1, metalness: 0.1 }), // bright sclera
      iris:    new THREE.MeshStandardMaterial({ color: '#3D2008', roughness: 0.1, metalness: 0.2 }),
      pupil:   new THREE.MeshStandardMaterial({ color: '#000000', roughness: 0.1 }),
      lip:     skinMat('#C06C5A', 0.35),   // natural pinkish lip
      brow:    new THREE.MeshStandardMaterial({ color: '#1A1110', roughness: 0.8 }),
    };
  }, []);
}

// ═════════════════════════════════════════════════
// FACE DETAIL  (world-positioned inside headRef)
// Hidden when hasFace=true (photo face is active)
// ═════════════════════════════════════════════════
function FaceDetails({ mat, visible = true }: { mat: ReturnType<typeof useMat>; visible?: boolean }) {
  if (!visible) return null;
  return (
    <>
      {/* Eyes */}
      {([-1, 1] as const).map(side => (
        <group key={side} position={[side * 0.082, 0.038, 0.155]}>
          {/* Sclera (white) */}
          <mesh material={mat.eyeW} scale={[1.0, 0.88, 0.50]}>
            <sphereGeometry args={[0.036, 16, 16]} />
          </mesh>
          {/* Iris */}
          <mesh material={mat.iris} position={[0, 0, 0.018]} scale={[1, 1, 0.35]}>
            <sphereGeometry args={[0.022, 14, 14]} />
          </mesh>
          {/* Pupil */}
          <mesh material={mat.pupil} position={[0, 0, 0.030]} scale={[1, 1, 0.20]}>
            <sphereGeometry args={[0.012, 8, 8]} />
          </mesh>
          {/* Specular highlight */}
          <mesh material={mat.eyeW} position={[side * -0.007, 0.008, 0.040]}>
            <sphereGeometry args={[0.004, 5, 5]} />
          </mesh>
          {/* Eyebrow */}
          <mesh material={mat.brow}
            position={[0, 0.054, 0.014]}
            rotation={[0, 0, side * -0.12]}>
            <boxGeometry args={[0.060, 0.011, 0.013]} />
          </mesh>
        </group>
      ))}

      {/* Nose bridge */}
      <mesh material={mat.skinLt} position={[0, -0.010, 0.188]}>
        <boxGeometry args={[0.018, 0.056, 0.016]} />
      </mesh>
      {/* Nose tip */}
      <mesh material={mat.skinLt} position={[0, -0.055, 0.196]} scale={[1.1, 0.85, 0.80]}>
        <sphereGeometry args={[0.022, 10, 10]} />
      </mesh>
      {/* Nostrils */}
      {([-1, 1] as const).map(s => (
        <mesh key={s} material={mat.skin} position={[s * 0.020, -0.062, 0.192]} scale={[0.7, 0.6, 0.5]}>
          <sphereGeometry args={[0.012, 8, 8]} />
        </mesh>
      ))}

      {/* Upper lip */}
      <mesh material={mat.lip} position={[0, -0.090, 0.192]}>
        <boxGeometry args={[0.070, 0.015, 0.014]} />
      </mesh>
      {/* Lower lip (fuller) */}
      <mesh material={mat.lip} position={[0, -0.107, 0.192]} scale={[0.92, 1.3, 1]}>
        <boxGeometry args={[0.070, 0.015, 0.014]} />
      </mesh>
      {/* Philtrum crease */}
      <mesh material={mat.skin} position={[0, -0.074, 0.194]}>
        <boxGeometry args={[0.016, 0.016, 0.008]} />
      </mesh>

      {/* Ears */}
      {([-1, 1] as const).map(s => (
        <group key={s} position={[s * 0.198, 0.010, 0.020]}>
          <mesh material={mat.skinLt} scale={[0.36, 0.60, 0.40]}>
            <sphereGeometry args={[0.055, 10, 10]} />
          </mesh>
          {/* Inner ear */}
          <mesh material={mat.skin} position={[s * -0.008, 0, 0.012]} scale={[0.30, 0.50, 0.30]}>
            <sphereGeometry args={[0.040, 8, 8]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ═════════════════════════════════════════════════
// PHOTO FACE — Clean face replacement on the avatar
// ═════════════════════════════════════════════════
function PhotoFace({ url, mat }: { url: string; mat: ReturnType<typeof useMat> }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const S = 512;
      const canvas = document.createElement('canvas');
      canvas.width = S;
      canvas.height = S;
      const ctx = canvas.getContext('2d')!;
      if (!ctx) return;

      // ── Step 1: Draw image center-cropped ──
      const srcSize = Math.min(img.width, img.height);
      const srcX = (img.width - srcSize) / 2;
      const srcY = Math.max(0, (img.height - srcSize) / 2 - srcSize * 0.08);
      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, S, S);

      // ── Step 2: Oval mask — keeps only the face, removes background ──
      ctx.globalCompositeOperation = 'destination-in';
      ctx.beginPath();
      ctx.ellipse(S / 2, S / 2, S * 0.42, S * 0.48, 0, 0, Math.PI * 2);
      ctx.closePath();

      // Feathered gradient inside the ellipse
      const grad = ctx.createRadialGradient(S / 2, S / 2, S * 0.18, S / 2, S / 2, S * 0.46);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(0.6, 'rgba(0,0,0,1)');
      grad.addColorStop(0.82, 'rgba(0,0,0,0.5)');
      grad.addColorStop(1.0, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.needsUpdate = true;
      setTexture(tex);
    };
    img.src = url;
  }, [url]);

  if (!texture) return null;

  return (
    <group>
      {/* Dark back-of-head sphere (visible from sides/back) */}
      <mesh position={[0, 0.115, 0]} scale={[1, 1.05, 0.96]}>
        <sphereGeometry args={[0.208, 32, 32]} />
        <meshStandardMaterial color="#8B6F54" roughness={0.6} />
      </mesh>

      {/* Ears */}
      {([-1, 1] as const).map(s => (
        <group key={s} position={[s * 0.198, 0.010, 0.020]}>
          <mesh material={mat.skinLt} scale={[0.36, 0.60, 0.40]}>
            <sphereGeometry args={[0.055, 10, 10]} />
          </mesh>
          <mesh material={mat.skin} position={[s * -0.008, 0, 0.012]} scale={[0.30, 0.50, 0.30]}>
            <sphereGeometry args={[0.040, 8, 8]} />
          </mesh>
        </group>
      ))}

      {/* Face photo — flat oval plane at the front of the head */}
      <mesh
        position={[0, 0.08, 0.200]}
        renderOrder={10}
      >
        <planeGeometry args={[0.38, 0.44, 1, 1]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.02}
          roughness={0.45}
          side={THREE.FrontSide}
          depthWrite={true}
        />
      </mesh>
    </group>
  );
}

// ═════════════════════════════════════════════════
// MAIN AVATAR
// ═════════════════════════════════════════════════
function Avatar({ queue, onSignComplete, avatarUrl }: Pick<SignAvatarOverlayProps, 'queue' | 'onSignComplete' | 'avatarUrl'>) {
  const mat = useMat();
  const [localFaceUrl, setLocalFaceUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check if the user uploaded a family/caregiver photo during registration
    const storedFace = localStorage.getItem('avatar_face_url');
    if (storedFace) {
      setLocalFaceUrl(storedFace);
    } else if (avatarUrl) {
      setLocalFaceUrl(avatarUrl);
    }
  }, [avatarUrl]);

  // ── Bone refs (match signPoses.ts bone names) ────────────────
  const spineRef = useRef<THREE.Group>(null);
  const chestRef = useRef<THREE.Group>(null);
  const neckRef  = useRef<THREE.Group>(null);
  const headRef  = useRef<THREE.Group>(null);
  const lArmRef  = useRef<THREE.Group>(null);  // LeftArm
  const lFARef   = useRef<THREE.Group>(null);  // LeftForeArm
  const lHRef    = useRef<THREE.Group>(null);  // LeftHand
  const rArmRef  = useRef<THREE.Group>(null);  // RightArm
  const rFARef   = useRef<THREE.Group>(null);  // RightForeArm
  const rHRef    = useRef<THREE.Group>(null);  // RightHand
  const lFingersRef = useRef<THREE.Group>(null);
  const lThumbRef   = useRef<THREE.Group>(null);
  const rFingersRef = useRef<THREE.Group>(null);
  const rThumbRef   = useRef<THREE.Group>(null);

  const boneMap = useRef<Record<string, React.RefObject<THREE.Group>>>({});
  useEffect(() => {
    boneMap.current = {
      // Both keys map to spine so both old and new sign poses work
      Spine: spineRef, Spine1: spineRef,
      Chest: chestRef, UpperChest: chestRef,
      Neck: neckRef,   Head: headRef,
      LeftArm: lArmRef,   LeftForeArm: lFARef,  LeftHand: lHRef,
      RightArm: rArmRef,  RightForeArm: rFARef, RightHand: rHRef,
      LeftFingers: lFingersRef, LeftThumb: lThumbRef,
      RightFingers: rFingersRef, RightThumb: rThumbRef,
    };
  }, []);

  // ── Animation engine ─────────────────────────────────────
  const st = useRef({
    sign: null as ReturnType<typeof resolveSign>,
    kf: 0, t: 0, playing: false, word: '',
    idle: 0, cooldown: 0, lastWord: '',
  });
  const [playing, setPlaying] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [isFingerspell, setIsFingerspell] = useState(false);

  const play = useCallback((token: string) => {
    const { sign, confidence: conf, isFingerspell: isFS } = resolveToken(token);
    if (!sign) {
      // Completely unknown — skip with tiny delay
      setTimeout(() => onSignComplete(token), 150);
      return;
    }
    setConfidence(conf);
    setIsFingerspell(isFS);
    const state = st.current;
    state.sign = sign; state.kf = 0; state.t = 0; state.playing = true; state.word = token;
    setPlaying(true);
  }, [onSignComplete]);

  useEffect(() => {
    if (!playing && queue.length > 0) play(queue[0]);
  }, [queue, playing, play]);

  useFrame((_, dt) => {
    const state = st.current;
    state.idle += dt;

    // Tick down cooldown between signs
    if (state.cooldown > 0) {
      state.cooldown -= dt;
      // breathe gently while cooling down
      const i = state.idle;
      const b = Math.sin(i * 1.2) * 0.012;
      if (spineRef.current) slerp(spineRef.current, { x: b, y: 0, z: 0 }, 1);
      if (headRef.current)  slerp(headRef.current,  { x: Math.sin(i*0.45)*0.010, y: Math.sin(i*0.55)*0.015, z: 0 }, 1);
      return;
    }

    if (state.playing && state.sign) {
      const kf = state.sign.keyframes[state.kf];
      if (!kf) {
        // Finished all keyframes
        state.playing = false; state.sign = null;
        const w = state.word; state.word = '';
        state.cooldown = 0.4;   // shorter cooldown = snappier between signs
        setPlaying(false); onSignComplete(w); return;
      }
      state.t += dt;
      // alpha drives how far through THIS keyframe we are (0→1)
      const alpha = Math.min(state.t / Math.max(kf.duration, 0.01), 1);
      for (const [name, rot] of Object.entries(kf.bones)) {
        const ref = boneMap.current[name];
        if (ref?.current) slerp(ref.current, rot, alpha);
      }
      if (state.t >= kf.duration) { state.kf++; state.t = 0; }
    } else {
      // Idle breathing + subtle sway
      const i = state.idle;
      const breath = Math.sin(i * 1.2) * 0.012;
      if (spineRef.current) slerp(spineRef.current, { x: breath, y: 0, z: 0 }, 1);
      if (chestRef.current) slerp(chestRef.current, { x: breath * 0.5, y: 0, z: 0 }, 1);
      if (headRef.current)  slerp(headRef.current,  { x: Math.sin(i*0.45)*0.010, y: Math.sin(i*0.55)*0.020, z: 0 }, 1);
      if (neckRef.current)  slerp(neckRef.current,  { x: 0, y: Math.sin(i*0.50)*0.012, z: 0 }, 1);
      if (lArmRef.current)  slerp(lArmRef.current,  { x: 0, y: 0, z:  0.08 + Math.sin(i*0.65)*0.005 }, 1);
      if (rArmRef.current)  slerp(rArmRef.current,  { x: 0, y: 0, z: -0.08 - Math.sin(i*0.65+1)*0.005 }, 1);
    }
  });

  // ── Geometry helpers ─────────────────────────────────────────
  const Cap = ({ r, h, mat: m }: { r: number; h: number; mat: THREE.Material }) => (
    <mesh material={m}><capsuleGeometry args={[r, h, 8, 16]} /></mesh>
  );
  const Sph = ({ r, mat: m }: { r: number; mat: THREE.Material }) => (
    <mesh material={m}><sphereGeometry args={[r, 14, 14]} /></mesh>
  );

  // ── Full arm assembly (left or right) ────────────────────────
  const Arm = ({ side }: { side: -1 | 1 }) => {
    const isL = side === -1;
    return (
      // Shoulder point: where arm attaches to the torso
      // Position relative to chestRef: [±0.26, 0.46, 0]
      <group position={[side * 0.260, 0.460, 0]}>
        {/* Shoulder socket — fills gap perfectly */}
        <Sph r={0.072} mat={mat.shirt} />

        {/* UpperArm group (the bone) */}
        <group ref={isL ? lArmRef : rArmRef}>
          {/* Upper arm capsule — hangs down from shoulder */}
          <mesh material={mat.shirt} position={[0, -0.135, 0]}>
            <capsuleGeometry args={[0.062, 0.22, 8, 14]} />
          </mesh>

          {/* Elbow joint */}
          <mesh material={mat.skinLt} position={[0, -0.265, 0]}>
            <sphereGeometry args={[0.058, 12, 12]} />
          </mesh>

          {/* ForeArm group */}
          <group ref={isL ? lFARef : rFARef} position={[0, -0.265, 0]}>
            <mesh material={mat.skinLt} position={[0, -0.130, 0]}>
              <capsuleGeometry args={[0.050, 0.22, 6, 14]} />
            </mesh>

            {/* Wrist joint */}
            <mesh material={mat.skinLt} position={[0, -0.252, 0]}>
              <sphereGeometry args={[0.044, 10, 10]} />
            </mesh>

            {/* Hand group */}
            <group ref={isL ? lHRef : rHRef} position={[0, -0.270, 0]}>
              {/* Palm */}
              <mesh material={mat.skin} scale={[1.05, 0.82, 0.52]}>
                <sphereGeometry args={[0.056, 14, 14]} />
              </mesh>
              {/* 4 Fingers */}
              <group ref={isL ? lFingersRef : rFingersRef} position={[0, -0.04, 0.01]}>
                {[0, 1, 2, 3].map(fi => (
                  <mesh key={fi} material={mat.skin}
                    position={[(fi - 1.5) * 0.022, -0.024, 0]}
                    rotation={[0.15, 0, 0]}>
                    <capsuleGeometry args={[0.011, 0.048, 4, 8]} />
                  </mesh>
                ))}
              </group>
              {/* Thumb */}
              <group ref={isL ? lThumbRef : rThumbRef} position={[side * 0.048, -0.01, 0.02]}>
                <mesh material={mat.skin}
                  position={[0, -0.014, 0]}
                  rotation={[0.15, 0, side * 0.55]}>
                  <capsuleGeometry args={[0.013, 0.036, 4, 8]} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
    );
  };

  return (
    <group>
      {/* ── SPINE ───────────────────────────────────────── */}
      <group ref={spineRef}>

        {/* Waist / lower torso (mostly cropped by camera) */}
        <mesh material={mat.pants} position={[0, -0.04, 0]}>
          <capsuleGeometry args={[0.155, 0.08, 6, 14]} />
        </mesh>
        {/* Hip joints (cropped) */}
        {([-1, 1] as const).map(s => (
          <mesh key={s} material={mat.pants} position={[s * 0.090, -0.18, 0]}>
            <capsuleGeometry args={[0.062, 0.14, 6, 10]} />
          </mesh>
        ))}

        {/* ── CHEST ─────────────────────────────────────── */}
        <group ref={chestRef}>
          {/* Main torso — more human realistic taper */}
          <mesh material={mat.shirt} position={[0, 0.20, 0]} scale={[1.1, 1.05, 0.85]}>
            <capsuleGeometry args={[0.165, 0.35, 12, 24]} />
          </mesh>

          {/* Collar area */}
          <mesh material={mat.shirt} position={[0, 0.41, 0]} scale={[1.05, 1, 0.80]}>
            <sphereGeometry args={[0.155, 16, 16]} />
          </mesh>

          {/* Shoulder bar (more sloped, natural shoulders) */}
          <mesh material={mat.shirt} position={[0, 0.43, 0]}
            rotation={[0, 0, Math.PI / 2]}
            scale={[1, 1, 0.85]}>
            <capsuleGeometry args={[0.075, 0.42, 8, 16]} />
          </mesh>

          {/* Accent stripe on chest */}
          <mesh material={mat.accent} position={[0, 0.25, 0.180]}>
            <boxGeometry args={[0.060, 0.120, 0.008]} />
          </mesh>
          {/* Collar accent */}
          <mesh material={mat.accent} position={[0, 0.43, 0.012]}>
            <torusGeometry args={[0.085, 0.014, 8, 20, Math.PI]} />
          </mesh>

          {/* ── LEFT ARM ─────────────────────────────── */}
          <Arm side={-1} />
          {/* ── RIGHT ARM ────────────────────────────── */}
          <Arm side={1} />

          {/* ── NECK ──────────────────────────────────── */}
          <group ref={neckRef} position={[0, 0.48, 0]}>
            <mesh material={mat.skin} position={[0, 0.065, 0]}>
              <capsuleGeometry args={[0.064, 0.095, 6, 12]} />
            </mesh>

            {/* ── HEAD ──────────────────────────────── */}
            <group ref={headRef} position={[0, 0.190, 0]}>
              {/* Main skull — HIDE when photo face is active (prevents fishbowl) */}
              {!localFaceUrl && (
                <>
                  <mesh material={mat.skinLt} position={[0, 0.115, 0]}
                    scale={[1, 1.05, 0.96]}>
                    <sphereGeometry args={[0.210, 32, 32]} />
                  </mesh>
                  <mesh material={mat.skinLt} position={[0, -0.020, 0.025]}
                    scale={[0.80, 0.52, 0.82]}>
                    <sphereGeometry args={[0.210, 24, 24]} />
                  </mesh>
                  <mesh material={mat.skinLt} position={[0, 0.200, 0.06]}
                    scale={[0.90, 0.60, 0.70]}>
                    <sphereGeometry args={[0.180, 18, 18]} />
                  </mesh>
                </>
              )}

              {/* ── HAIR ──────────────────────────── */}
              {/* Top dome — hide when photo face to prevent helmet visor */}
              {!localFaceUrl && (
                <mesh material={mat.hair} position={[0, 0.200, -0.018]}
                  scale={[1.02, 0.80, 1.00]}>
                  <sphereGeometry args={[0.214, 28, 28, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
                </mesh>
              )}
              {/* Side pieces */}
              {([-1, 1] as const).map(s => (
                <mesh key={s} material={mat.hair}
                  position={[s * 0.205, 0.095, -0.055]}
                  scale={[0.32, 0.70, 0.42]}>
                  <sphereGeometry args={[0.175, 10, 10]} />
                </mesh>
              ))}
              {/* Back */}
              <mesh material={mat.hair} position={[0, 0.065, -0.195]}
                scale={[0.92, 0.68, 0.38]}>
                <sphereGeometry args={[0.214, 16, 16]} />
              </mesh>
              {/* Front hairline — hide when photo face is active to avoid overlap */}
              {!localFaceUrl && (
                <mesh material={mat.hair} position={[0, 0.285, 0.082]}
                  scale={[0.88, 0.28, 0.55]}>
                  <sphereGeometry args={[0.180, 14, 14]} />
                </mesh>
              )}

              {/* ── FACE DETAILS ─────────────────── */}
              {localFaceUrl ? (
                <React.Suspense fallback={<FaceDetails mat={mat} visible={true} />}>
                  <PhotoFace url={localFaceUrl} mat={mat} />
                </React.Suspense>
              ) : (
                <FaceDetails mat={mat} visible={true} />
              )}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

// ═════════════════════════════════════════════════
// CAMERA LOCK — runs every frame
// ═════════════════════════════════════════════════
function CameraTarget() {
  useFrame(({ camera }) => {
    camera.lookAt(0, 0.45, 0);  // always look at upper chest
  });
  return null;
}

// ═════════════════════════════════════════════════
// MAIN EXPORT
// ═════════════════════════════════════════════════
export default function SignAvatarOverlay({
  queue, onSignComplete, className, isProcessing, avatarUrl
}: SignAvatarOverlayProps) {
  return (
    <div className={`relative flex flex-col bg-gradient-to-b from-[#0d0b20] via-[#0a0818] to-[#060412] border border-white/10 rounded-2xl overflow-hidden shadow-2xl ${className ?? ''}`}>

      {/* Live badge */}
      <div className="absolute top-2 left-2 z-10 pointer-events-none
                      flex items-center gap-1.5 bg-[#6C63FF]/25 border border-[#6C63FF]/40
                      backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold uppercase
                      tracking-wider text-[#6C63FF]">
        <span className={`w-1.5 h-1.5 rounded-full ${queue.length > 0 ? 'bg-[#6C63FF] animate-pulse' : 'bg-emerald-400'}`} />
        ISL Avatar
      </div>

      {/* AI badge */}
      <div className="absolute top-2 right-2 z-10 pointer-events-none">
        <span className="bg-gradient-to-r from-[#4F46E5] to-[#10B981] text-white text-[8px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow">
          ✨ Procedural AI
        </span>
      </div>

      {isProcessing && (
        <div className="absolute top-7 right-2 z-10 pointer-events-none text-yellow-300 text-[9px] flex items-center gap-1 animate-pulse">
          <span className="w-1 h-1 rounded-full bg-yellow-400 animate-ping" />
          Processing…
        </div>
      )}

      {/* 3D Canvas ── fills the container */}
      <div className="flex-1 w-full h-full">
        <Canvas
          shadows
          /**
           * position=[0, 0.70, 1.65]  fov=44
           * lookAt=[0, 0.45, 0]  (locked in CameraTarget)
           * → shows y=−0.20 to y=1.10  → head+chest in frame, legs clipped
           */
          camera={{ position: [0, 0.70, 1.65], fov: 44, near: 0.05, far: 20 }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3 }}
        >
          <CameraTarget />

          {/* Cinematic 5-light setup */}
          <ambientLight intensity={0.45} color="#d4dcff" />
          <directionalLight
            position={[1.5, 4.0, 2.5]} intensity={2.5} castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-near={0.1} shadow-camera-far={8}
            shadow-camera-left={-1.5} shadow-camera-right={1.5}
            shadow-camera-top={2} shadow-camera-bottom={-1}
          />
          <directionalLight position={[-2, 1.5, -0.5]} intensity={0.55} color="#7C6FFF" />
          <pointLight position={[0.5, 2.5, 1.5]} intensity={0.9}  color="#ffffff" distance={5} />
          <pointLight position={[-0.5, 0.5, 1.0]} intensity={0.45} color="#10B981" distance={4} />
          <pointLight position={[0, 3.0, -1.0]} intensity={0.30} color="#4F46E5"  distance={5} />

          <Environment preset="studio" />

          <React.Suspense fallback={null}>
            <Avatar queue={queue} onSignComplete={onSignComplete} avatarUrl={avatarUrl} />
          </React.Suspense>

          <ContactShadows
            position={[0, -0.06, 0]}
            opacity={0.50} scale={2.5} blur={2.0} color="#3730a3"
          />
        </Canvas>
      </div>

      {/* Sign queue bar */}
      <div className="shrink-0 px-3 py-2 bg-[#060412]/90 backdrop-blur border-t border-white/5">
        <div className="flex gap-1.5 flex-wrap min-h-[22px] items-center">
          {queue.length > 0 ? (
            <>
              <span className="text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded
                               bg-emerald-500/15 border border-emerald-500/30 animate-pulse">
                🤟 &quot;{queue[0]}&quot;
              </span>
              {queue.slice(1, 4).map((w, i) => (
                <span key={i} className="text-white/35 text-xs px-2 py-0.5 rounded bg-white/5 border border-white/8">
                  {w}
                </span>
              ))}
              {queue.length > 4 && (
                <span className="text-white/20 text-[10px]">+{queue.length - 4}</span>
              )}
            </>
          ) : (
            <span className="text-white/25 text-xs italic">Waiting for speech…</span>
          )}
        </div>
      </div>
    </div>
  );
}
