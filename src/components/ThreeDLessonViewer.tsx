import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThreeDModelInfo, ThreeDPart } from '../types';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Sparkles,
  Maximize2,
  Minimize2,
  Eye,
  Info,
  CheckCircle2,
  Box,
  Layers,
  Heart,
  Atom,
  Zap,
  Activity
} from 'lucide-react';

interface ThreeDLessonViewerProps {
  modelInfo: ThreeDModelInfo;
  onClose?: () => void;
  isModal?: boolean;
}

export const PRESET_3D_MODELS: Record<string, ThreeDModelInfo> = {
  heart: {
    id: '3d-heart-model',
    title: 'قلب الإنسان - التشريح والوظيفة الحيوية',
    category: 'biology',
    modelType: 'heart',
    hasHeartbeatAnimation: true,
    summary:
      'عضو عضلي بحجم قبضة اليد؛ يقع في منتصف الصدر مع الميل قليلاً إلى جهة اليسار. يعتبر القلب العضو الأساسي في الجهاز الدوراني، حيث يقوم بضخ الدم وتوزيعه إلى جميع أعضاء الجسم عن طريق الانقباض والانبساط بشكل منتظم.',
    parts: [
      {
        id: 'p1',
        name: '١- الأبهر (Aorta)',
        description:
          'أكبر وأهم شريان في جسم الإنسان. ينبعث من البطين الأيسر ويقوم بتوزيع الدم المؤكسج القادم من الرئتين إلى كافة أنحاء وأنسجة الجسم.',
        function: 'توصيل الدم الغني بالأكسجين لجميع أجهزة الجسم.',
        position: [0, 1.8, 0.2],
        color: '#dc2626'
      },
      {
        id: 'p2',
        name: '٢- الشريان الرئوي (Pulmonary Artery)',
        description:
          'ينقل الدم غير المؤكسج من البطين الأيمن في القلب إلى الرئتين ليتزود بالأكسجين ويتخلص من ثاني أكسيد الكربون.',
        function: 'توجيه الدم للرئتين لتبادل الغازات.',
        position: [-0.6, 1.2, 0.4],
        color: '#2563eb'
      },
      {
        id: 'p3',
        name: '٣- الوريد الأجوف العلوي (Superior Vena Cava)',
        description:
          'وريد كبير يجمع الدم غير المؤكسج من الأجزاء العلوية للجسم (الرأس، الرقبة، والذراعين) ويعيده إلى الأذين الأيمن.',
        function: 'إعادة الدم من الجسد العادي للأذين الأيمن.',
        position: [0.8, 1.5, -0.3],
        color: '#1d4ed8'
      },
      {
        id: 'p4',
        name: '٤- الوريدان الرئويان (Pulmonary Veins)',
        description:
          'تنقل الدم المؤكسج الصافي والنقي من الرئتين وتصبه في الأذين الأيسر للقلب لتهيئته للضخ العام.',
        function: 'إدخال الدم الغني بالأكسجين إلى الأذين الأيسر.',
        position: [-0.9, 0.6, -0.5],
        color: '#ef4444'
      },
      {
        id: 'p5',
        name: '٥- الوريد الأجوف السفلي (Inferior Vena Cava)',
        description:
          'ينقل الدم غير المؤكسج المتجمع من الأجزاء السفلى من الجسم (البطن، الأطراف السفلى) وينتهي في الأذين الأيمن.',
        function: 'جمع الدم من أسفل الجسم وإعادته للقلب.',
        position: [0.7, -1.2, -0.2],
        color: '#1e40af'
      },
      {
        id: 'p6',
        name: '٦- البطين الأيسر والأيمن (Ventricles)',
        description:
          'الحجرتان السفليتان للقلب. يتميز البطين الأيسر بجدار عضلي سميك جداً لأنه يضخ الدم بقوة لكل أجزاء الجسم.',
        function: 'الانقباض لضخ الدم للرئتين والجسم.',
        position: [-0.2, -0.8, 0.5],
        color: '#b91c1c'
      }
    ]
  },
  molecule: {
    id: '3d-molecule-model',
    title: 'التركيب الجزئي للماء (H₂O)',
    category: 'chemistry',
    modelType: 'molecule',
    summary:
      'يتكون جزيء الماء من ذرة أكسجين واحدة مرتبطة بذرتي هيدروجين برابطتين تساهميتين أحاديتين بزاوية مقدارها 104.5 درجة، مما يجعله جزيئاً قطبياً فريداً.',
    parts: [
      {
        id: 'm1',
        name: 'ذرة الأكسجين (Oxygen Atom)',
        description: 'ذرة مركزية ذات كهروسالبية عالية تجذب الإلكترونات إليها.',
        function: 'تكوين الروابط الهيدروجينية القطبية.',
        position: [0, 0, 0],
        color: '#ef4444'
      },
      {
        id: 'm2',
        name: 'ذرة الهيدروجين الأول (Hydrogen Atom 1)',
        description: 'ذرة هيدروجين ترتبط بالأكسجين برابطة تساهمية قطبية.',
        function: 'المساهمة بإلكترون تكافؤ.',
        position: [-1.2, -0.9, 0],
        color: '#f8fafc'
      },
      {
        id: 'm3',
        name: 'ذرة الهيدروجين الثاني (Hydrogen Atom 2)',
        description: 'ذرة هيدروجين ثانية بزاوية 104.5 درجة مع الذرة الأولى.',
        function: 'إكمال الرابطة التساهمية المستقرة.',
        position: [1.2, -0.9, 0],
        color: '#f8fafc'
      }
    ]
  },
  cell: {
    id: '3d-cell-model',
    title: 'الخلية النباتية النموذجية 3D',
    category: 'biology',
    modelType: 'cell',
    summary:
      'الوحدة التركيبية والوظيفية الأساسية للنبات. تتميز بوجود جدار خلوي صلب وبلاستيدات خضراء للبناء الضوئي وفجوة عصارية مركزية كبيرة.',
    parts: [
      {
        id: 'c1',
        name: 'النواة (Nucleus)',
        description: 'مركز التحكم بالخلية وتحتوي على الحمض النووي (DNA).',
        function: 'تنظيم كافة الأنشطة الحيوية والانقسام.',
        position: [0, 0.2, 0],
        color: '#8b5cf6'
      },
      {
        id: 'c2',
        name: 'البلاستيدات الخضراء (Chloroplasts)',
        description: 'عضيات تحتوي على الصبغة الخضراء (الكلوروفيل).',
        function: 'امتصاص الضوء والقيام بالبناء الضوئي.',
        position: [-1.1, 0.8, 0.3],
        color: '#22c55e'
      },
      {
        id: 'c3',
        name: 'الميتوكندريا (Mitochondria)',
        description: 'محطات توليد الطاقة في الخلية.',
        function: 'التنفس الخلوي وإنتاج جزيئات ATP.',
        position: [1.1, -0.5, 0.2],
        color: '#f97316'
      }
    ]
  }
};

export const ThreeDLessonViewer: React.FC<ThreeDLessonViewerProps> = ({
  modelInfo,
  onClose,
  isModal = false
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedPart, setSelectedPart] = useState<ThreeDPart | null>(modelInfo.parts[0] || null);
  const [isPlayingPulse, setIsPlayingPulse] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mainGroupRef = useRef<THREE.Group | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);

  // Mouse Interaction State
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 600;
    const height = mountRef.current.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a'); // Cool Slate Navy
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(5, 8, 5);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.8);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xff3366, 1.5, 10);
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);

    // 5. Main Model Group Construction
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);
    mainGroupRef.current = mainGroup;

    // Construct 3D Geometry based on Model Type
    if (modelInfo.modelType === 'heart' || modelInfo.category === 'biology') {
      buildHumanHeart3D(mainGroup);
    } else if (modelInfo.modelType === 'molecule') {
      buildMolecule3D(mainGroup);
    } else if (modelInfo.modelType === 'cell') {
      buildCell3D(mainGroup);
    } else {
      buildDefault3D(mainGroup);
    }

    // 6. Interactive Pins Group
    const pinsGroup = new THREE.Group();
    mainGroup.add(pinsGroup);
    pinsGroupRef.current = pinsGroup;

    modelInfo.parts.forEach((part) => {
      const pinSphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const pinMat = new THREE.MeshStandardMaterial({
        color: part.color || '#3b82f6',
        emissive: part.color || '#3b82f6',
        emissiveIntensity: 0.6,
        roughness: 0.2
      });
      const pinMesh = new THREE.Mesh(pinSphereGeo, pinMat);
      pinMesh.position.set(part.position[0], part.position[1], part.position[2]);
      pinMesh.userData = { partId: part.id, partInfo: part };
      pinsGroup.add(pinMesh);

      // Ring indicator around pin
      const ringGeo = new THREE.RingGeometry(0.16, 0.2, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(part.position[0], part.position[1], part.position[2]);
      ringMesh.lookAt(camera.position);
      pinsGroup.add(ringMesh);
    });

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Auto rotation
      if (autoRotate && mainGroupRef.current && !isDragging.current) {
        mainGroupRef.current.rotation.y += 0.005;
      }

      // Heartbeat pulse animation
      if (isPlayingPulse && mainGroupRef.current) {
        const pulse = Math.sin(elapsedTime * 6) * 0.04;
        const scale = 1 + pulse;
        mainGroupRef.current.scale.set(scale, scale, scale);
      }

      // Rotate pin rings to face camera
      if (pinsGroupRef.current && cameraRef.current) {
        pinsGroupRef.current.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.geometry instanceof THREE.RingGeometry) {
            child.lookAt(cameraRef.current!.position);
          }
        });
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (rendererRef.current && rendererRef.current.domElement) {
        mountRef.current?.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, [modelInfo]);

  // Helper Procedural 3D Builders
  function buildHumanHeart3D(group: THREE.Group) {
    // Heart Body - Main muscular ventricles
    const heartGeo = new THREE.SphereGeometry(1.2, 32, 32);
    // Deform sphere to create heart shape
    const posAttribute = heartGeo.attributes.position;
    for (let i = 0; i < posAttribute.count; i++) {
      let x = posAttribute.getX(i);
      let y = posAttribute.getY(i);
      let z = posAttribute.getZ(i);

      if (y < 0) {
        // Taper towards bottom apex
        x *= 1 - Math.abs(y) * 0.35;
        z *= 1 - Math.abs(y) * 0.35;
      } else {
        // Broaden top atria
        x *= 1 + y * 0.15;
      }
      posAttribute.setXYZ(i, x, y, z);
    }
    heartGeo.computeVertexNormals();

    const heartMat = new THREE.MeshStandardMaterial({
      color: 0xc0392b,
      roughness: 0.4,
      metalness: 0.1,
      bumpScale: 0.05
    });
    const heartMesh = new THREE.Mesh(heartGeo, heartMat);
    heartMesh.rotation.z = -0.15;
    group.add(heartMesh);

    // 1. Aorta Arch (الأبهر) - Red Torus/Tube
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.8, 0.1),
      new THREE.Vector3(0.2, 1.5, 0.2),
      new THREE.Vector3(-0.3, 1.9, 0.1),
      new THREE.Vector3(-0.7, 1.4, -0.2)
    ]);
    const aortaGeo = new THREE.TubeGeometry(aortaCurve, 32, 0.25, 16, false);
    const aortaMat = new THREE.MeshStandardMaterial({
      color: 0xd32f2f,
      roughness: 0.3,
      metalness: 0.2
    });
    const aortaMesh = new THREE.Mesh(aortaGeo, aortaMat);
    group.add(aortaMesh);

    // 2. Pulmonary Artery (الشريان الرئوي) - Blue Tube
    const paCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.2, 0.5, 0.4),
      new THREE.Vector3(-0.5, 1.2, 0.3),
      new THREE.Vector3(-0.9, 1.4, -0.1)
    ]);
    const paGeo = new THREE.TubeGeometry(paCurve, 24, 0.22, 16, false);
    const paMat = new THREE.MeshStandardMaterial({ color: 0x1976d2, roughness: 0.3 });
    const paMesh = new THREE.Mesh(paGeo, paMat);
    group.add(paMesh);

    // 3. Superior Vena Cava (الوريد الأجوف العلوي) - Deep Blue
    const svcGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.4, 16);
    const svcMat = new THREE.MeshStandardMaterial({ color: 0x0d47a1, roughness: 0.4 });
    const svcMesh = new THREE.Mesh(svcGeo, svcMat);
    svcMesh.position.set(0.75, 1.2, -0.2);
    group.add(svcMesh);

    // 4. Coronary Vessels / Arteries (الشرايين التاجية الدقيقة)
    for (let i = 0; i < 5; i++) {
      const vesselCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.1, 0.6 - i * 0.2, 1.15 - i * 0.05),
        new THREE.Vector3(-0.2 - i * 0.1, 0.3 - i * 0.25, 1.1 - i * 0.05),
        new THREE.Vector3(-0.35, -0.1 - i * 0.25, 0.9 - i * 0.08)
      ]);
      const vesselGeo = new THREE.TubeGeometry(vesselCurve, 16, 0.04, 8, false);
      const vesselMat = new THREE.MeshBasicMaterial({ color: 0xff4d4d });
      const vesselMesh = new THREE.Mesh(vesselGeo, vesselMat);
      group.add(vesselMesh);
    }
  }

  function buildMolecule3D(group: THREE.Group) {
    // Oxygen
    const oxygenGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const oxygenMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 });
    const oxygenMesh = new THREE.Mesh(oxygenGeo, oxygenMat);
    group.add(oxygenMesh);

    // Hydrogens
    const h1Geo = new THREE.SphereGeometry(0.45, 32, 32);
    const hMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    const h1Mesh = new THREE.Mesh(h1Geo, hMat);
    h1Mesh.position.set(-1.2, -0.9, 0);
    group.add(h1Mesh);

    const h2Mesh = new THREE.Mesh(h1Geo, hMat);
    h2Mesh.position.set(1.2, -0.9, 0);
    group.add(h2Mesh);

    // Bonds
    const bondMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.3 });
    const b1Geo = new THREE.CylinderGeometry(0.1, 0.1, 1.3, 16);

    const b1Mesh = new THREE.Mesh(b1Geo, bondMat);
    b1Mesh.position.set(-0.6, -0.45, 0);
    b1Mesh.rotation.z = Math.PI / 4;
    group.add(b1Mesh);

    const b2Mesh = new THREE.Mesh(b1Geo, bondMat);
    b2Mesh.position.set(0.6, -0.45, 0);
    b2Mesh.rotation.z = -Math.PI / 4;
    group.add(b2Mesh);
  }

  function buildCell3D(group: THREE.Group) {
    // Cell Wall
    const wallGeo = new THREE.BoxGeometry(3, 2.2, 1.5);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      wireframe: false,
      transparent: true,
      opacity: 0.4
    });
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    group.add(wallMesh);

    // Nucleus
    const nucGeo = new THREE.SphereGeometry(0.5, 24, 24);
    const nucMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.3 });
    const nucMesh = new THREE.Mesh(nucGeo, nucMat);
    nucMesh.position.set(0, 0.2, 0);
    group.add(nucMesh);

    // Chloroplasts
    for (let i = 0; i < 4; i++) {
      const cGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
      const cMat = new THREE.MeshStandardMaterial({ color: 0x22c55e });
      const cMesh = new THREE.Mesh(cGeo, cMat);
      cMesh.position.set(-1 + (i % 2) * 2, 0.6 - Math.floor(i / 2) * 1.2, 0.3);
      group.add(cMesh);
    }
  }

  function buildDefault3D(group: THREE.Group) {
    const geo = new THREE.IcosahedronGeometry(1.2, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
  }

  // Mouse Handlers for 3D Drag Rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !mainGroupRef.current) return;

    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    mainGroupRef.current.rotation.y += deltaX * 0.01;
    mainGroupRef.current.rotation.x += deltaY * 0.01;

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleResetCamera = () => {
    if (mainGroupRef.current) {
      mainGroupRef.current.rotation.set(0, 0, 0);
      mainGroupRef.current.scale.set(1, 1, 1);
    }
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 7);
    }
    setSelectedPart(modelInfo.parts[0] || null);
  };

  const handleSpeakPartInfo = (part: ThreeDPart) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = `${part.name}. ${part.description}. الوظيفة الرئيسية: ${part.function}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'ar-SA';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      className={`bg-slate-950 text-white overflow-hidden flex flex-col ${
        isModal
          ? 'fixed inset-0 z-50 p-2 sm:p-6 bg-slate-950/95 backdrop-blur-md flex items-center justify-center'
          : 'rounded-3xl border border-slate-800 shadow-2xl my-4'
      }`}
    >
      <div className="w-full max-w-6xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl flex flex-col h-[85vh] max-h-[800px] overflow-hidden">
        {/* Header Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              <Box className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  {modelInfo.title}
                </h3>
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  نموذج 3D تفاعلي بالذكاء الاصطناعي
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                اسحب بالماوس لتدوير المجسم ثلاثي الأبعاد • انقر على أي جزء للشرح الفوري
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              title="ملء الشاشة"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-white rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 3D Stage & Parts Panel Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative">
          {/* 3D Canvas Stage (Col 8) */}
          <div
            className="lg:col-span-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Canvas Mount Container */}
            <div ref={mountRef} className="w-full h-full min-h-[380px]" />

            {/* Top Canvas Controls Bar */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10 bg-slate-900/80 backdrop-blur border border-slate-800 p-1.5 rounded-2xl shadow-lg">
              {modelInfo.hasHeartbeatAnimation && (
                <button
                  onClick={() => setIsPlayingPulse(!isPlayingPulse)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    isPlayingPulse
                      ? 'bg-rose-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span>{isPlayingPulse ? 'إيقاف الانقباض' : 'تشغيل نبض القلب'}</span>
                </button>
              )}

              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`p-2 rounded-xl text-xs font-bold transition ${
                  autoRotate
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="الدوران التلقائي"
              >
                <RotateCcw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleResetCamera}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
              >
                إعادة ضبط المنظر
              </button>
            </div>

            {/* Bottom Floating Watermark & Guide */}
            <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold text-slate-300 shadow-md">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                3D
              </div>
              <span>تحكم تفاعلي مباشر • محاكي «هتاف العاصمي» ثلاثي الأبعاد</span>
            </div>
          </div>

          {/* Side Explanation & Interactive Parts List (Col 4) */}
          <div className="lg:col-span-4 bg-slate-900 border-t lg:border-t-0 lg:border-r border-slate-800 p-5 overflow-y-auto space-y-5 flex flex-col justify-between">
            {/* Top Model Summary */}
            <div className="space-y-3">
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-cyan-300">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>ملخص الدرس والظاهرة العلمية:</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300 font-medium">
                  {modelInfo.summary}
                </p>
              </div>

              {/* Selected Part Card */}
              {selectedPart && (
                <div className="bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border border-blue-500/40 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-lg animate-fadeIn">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                        الجزء المحدد للتحليل:
                      </span>
                      <h4 className="text-sm font-black text-white mt-0.5">
                        {selectedPart.name}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleSpeakPartInfo(selectedPart)}
                      className={`p-2 rounded-xl transition ${
                        isSpeaking
                          ? 'bg-rose-600 text-white animate-bounce'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                      title="شرح بصوت الذكاء الاصطناعي"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">
                    {selectedPart.description}
                  </p>

                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-blue-900/60 text-xs">
                    <span className="font-extrabold text-blue-400">الوظيفة الأساسية: </span>
                    <span className="text-slate-300 font-medium">{selectedPart.function}</span>
                  </div>
                </div>
              )}

              {/* Anatomical / Structural Parts Selector List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>الأجزاء والتراكيب الهيكلية ({modelInfo.parts.length}):</span>
                  </span>
                  <span className="text-[10px] text-slate-400">اختر جزءاً للاستكشاف</span>
                </div>

                <div className="space-y-1.5 max-h-[260px] overflow-y-auto pe-1">
                  {modelInfo.parts.map((part) => {
                    const isSelected = selectedPart?.id === part.id;

                    return (
                      <button
                        key={part.id}
                        onClick={() => {
                          setSelectedPart(part);
                          handleSpeakPartInfo(part);
                        }}
                        className={`w-full text-right p-3 rounded-2xl text-xs font-bold transition flex items-center justify-between border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/20'
                            : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                            style={{ backgroundColor: part.color || '#3b82f6' }}
                          />
                          <span>{part.name}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Voice Prompt Action */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => selectedPart && handleSpeakPartInfo(selectedPart)}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>شرح تفاعلي بالذكاء الاصطناعي مع الصوت</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
