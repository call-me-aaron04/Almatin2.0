/**
 * SHIELDPLAN — 3D Room Visualization
 * Uses Three.js to render the 4-wall configuration with material colors, thickness, and labels.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface WallData {
  id: string;
  label: string;
  material: string;
  thickness: number;
  distance: number;
  adjacentArea: string;
  occupancyFactor: number;
}

export interface RoomDimensions {
  length: number;
  width: number;
  height: number;
}

const MATERIAL_COLORS: Record<string, string> = {
  'Concrete': '#808080',
  'Lead': '#3a3a3a',
  'Brick': '#b85c38',
  'Gypsum': '#d4c9b0',
  'Steel': '#8899aa',
  'Borated Polyethylene': '#4a8bc2',
};

const DEFAULT_WALLS: WallData[] = [
  { id: 'north', label: 'North', material: 'Concrete', thickness: 30, distance: 3.5, adjacentArea: 'Corridor', occupancyFactor: 0.5 },
  { id: 'south', label: 'South', material: 'Concrete', thickness: 30, distance: 3.5, adjacentArea: 'Office', occupancyFactor: 0.25 },
  { id: 'east', label: 'East', material: 'Concrete', thickness: 30, distance: 3.0, adjacentArea: 'Control Room', occupancyFactor: 1.0 },
  { id: 'west', label: 'West', material: 'Concrete', thickness: 30, distance: 3.0, adjacentArea: 'Outdoor Area', occupancyFactor: 0.1 },
];

export class Room3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private wallGroup: THREE.Group;
  private labelGroup: THREE.Group;
  private container: HTMLElement;
  private animId = 0;
  private hasInitialized = false;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found`);
    this.container = el;

    const width = this.container.clientWidth || 400;
    const height = this.container.clientHeight || 300;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    this.camera.position.set(9, 7, 9);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 25;
    this.controls.target.set(0, 1.5, 0);
    this.controls.maxPolarAngle = Math.PI / 2.1;

    this.wallGroup = new THREE.Group();
    this.labelGroup = new THREE.Group();
    this.scene.add(this.wallGroup);
    this.scene.add(this.labelGroup);

    this.setupEnvironment();
    this.animate();
    this.setupResize();

    // Render initial default room
    this.update(DEFAULT_WALLS, { length: 7, width: 5.5, height: 3 });
  }

  private setupEnvironment() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x446688, 0.7);
    this.scene.add(ambient);

    // Key light (warm)
    const key = new THREE.DirectionalLight(0xffeedd, 1.5);
    key.position.set(6, 12, 8);
    key.castShadow = true;
    key.shadow.mapSize.width = 1024;
    key.shadow.mapSize.height = 1024;
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = 30;
    key.shadow.camera.left = -10;
    key.shadow.camera.right = 10;
    key.shadow.camera.top = 10;
    key.shadow.camera.bottom = -10;
    this.scene.add(key);

    // Fill light (cool)
    const fill = new THREE.DirectionalLight(0x8888ff, 0.6);
    fill.position.set(-4, 3, -6);
    this.scene.add(fill);

    // Rim light
    const rim = new THREE.DirectionalLight(0x4488ff, 0.3);
    rim.position.set(0, -2, -8);
    this.scene.add(rim);

    // Grid
    const grid = new THREE.GridHelper(14, 14, 0x1a3a6a, 0x0a1a3a);
    grid.position.y = -0.01;
    this.scene.add(grid);

    // Ground plane (receives shadows)
    const groundGeo = new THREE.PlaneGeometry(14, 14);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.35, color: 0x000000 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Subtle ring around room
    const ringGeo = new THREE.RingGeometry(3.8, 4.0, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0066aa,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    this.scene.add(ring);

    // Fog
    this.scene.fog = new THREE.FogExp2(0x0a0e17, 0.025);
  }

  private setupResize() {
    const observer = new ResizeObserver(() => {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      if (width > 0 && height > 0) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      }
    });
    observer.observe(this.container);
  }

  update(walls: WallData[], dims: RoomDimensions) {
    // Dispose previous scene objects
    this.clearGroup(this.wallGroup);
    this.clearGroup(this.labelGroup);

    const L = Math.max(1, dims.length || 7);
    const W = Math.max(1, dims.width || 5.5);
    const H = Math.max(1, dims.height || 3);

    // Wall placement configs (position, rotation, size)
    const wallConfigs: Record<string, {
      pos: [number, number, number];
      euler: [number, number, number];
      size: [number, number];
    }> = {
      north: { pos: [0, H / 2, -W / 2], euler: [0, 0, 0], size: [L, H] },
      south: { pos: [0, H / 2, W / 2], euler: [0, Math.PI, 0], size: [L, H] },
      east:  { pos: [L / 2, H / 2, 0], euler: [0, Math.PI / 2, 0], size: [W, H] },
      west:  { pos: [-L / 2, H / 2, 0], euler: [0, -Math.PI / 2, 0], size: [W, H] },
    };

    // Track which walls exist in data
    const foundWalls = new Set<string>();

    walls.forEach((w) => {
      const cfg = wallConfigs[w.id];
      if (!cfg) return;
      foundWalls.add(w.id);

      const wallWidth = cfg.size[0] - 0.3;
      const wallHeight = cfg.size[1] - 0.3;
      const scaledThickness = Math.max(0.05, Math.min(0.8, w.thickness / 40));

      // Direction offset (push wall outward based on thickness)
      const offset: [number, number, number] = [0, 0, 0];
      if (w.id === 'north') offset[2] = -scaledThickness / 2;
      else if (w.id === 'south') offset[2] = scaledThickness / 2;
      else if (w.id === 'east') offset[0] = scaledThickness / 2;
      else if (w.id === 'west') offset[0] = -scaledThickness / 2;

      const color = MATERIAL_COLORS[w.material] || '#888888';
      const isMetallic = w.material === 'Lead' || w.material === 'Steel';

      // Main wall mesh
      const geo = new THREE.BoxGeometry(wallWidth, wallHeight, scaledThickness);
      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        metalness: isMetallic ? 0.7 : 0.0,
        roughness: isMetallic ? 0.25 : 0.75,
        transparent: true,
        opacity: 0.88,
        clearcoat: 0.05,
        clearcoatRoughness: 0.4,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        cfg.pos[0] + offset[0],
        cfg.pos[1],
        cfg.pos[2] + offset[2]
      );
      mesh.rotation.set(...cfg.euler);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.wallGroup.add(mesh);

      // Edge outline
      const edgeGeo = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: isMetallic ? 0.5 : 0.3,
      });
      const edges = new THREE.LineSegments(edgeGeo, edgeMat);
      edges.position.copy(mesh.position);
      edges.rotation.copy(mesh.rotation);
      this.wallGroup.add(edges);

      // Floor glow strip
      const stripGeo = new THREE.BoxGeometry(wallWidth, 0.04, 0.08);
      const stripMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.2,
      });
      const strip = new THREE.Mesh(stripGeo, stripMat);
      const stripOffset: [number, number, number] = [0, 0, 0];
      if (w.id === 'north') stripOffset[2] = -scaledThickness / 2;
      else if (w.id === 'south') stripOffset[2] = scaledThickness / 2;
      else if (w.id === 'east') stripOffset[0] = scaledThickness / 2;
      else if (w.id === 'west') stripOffset[0] = -scaledThickness / 2;
      strip.position.set(
        cfg.pos[0] + stripOffset[0],
        0.02,
        cfg.pos[2] + stripOffset[2]
      );
      strip.rotation.set(...cfg.euler);
      this.wallGroup.add(strip);

      // Label sprite
      this.createLabel(
        `${w.label}\n${w.material}\n${w.thickness} cm`,
        cfg.pos[0] + offset[0] * 2.5,
        H + 0.6,
        cfg.pos[2] + offset[2] * 2.5
      );

      // Distance / occupancy info below
      this.createLabel(
        `d=${w.distance.toFixed(1)}m · T=${w.occupancyFactor.toFixed(2)}`,
        cfg.pos[0] + offset[0] * 2,
        0.3,
        cfg.pos[2] + offset[2] * 2
      );
    });

    // Default walls for any not configured
    Object.entries(wallConfigs).forEach(([id, cfg]) => {
      if (foundWalls.has(id)) return;
      // Place a thin placeholder wall
      const geo = new THREE.BoxGeometry(cfg.size[0] - 0.3, cfg.size[1] - 0.3, 0.03);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0x2a3a5a,
        transparent: true,
        opacity: 0.15,
        roughness: 0.9,
        metalness: 0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      mesh.rotation.set(...cfg.euler);
      this.wallGroup.add(mesh);
    });

    // Floor
    const floorGeo = new THREE.BoxGeometry(L - 0.3, 0.08, W - 0.3);
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a1a3a,
      transparent: true,
      opacity: 0.35,
      roughness: 0.95,
      metalness: 0,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0.04, 0);
    floor.receiveShadow = true;
    this.wallGroup.add(floor);

    // Room label
    const dimText = `${L.toFixed(1)}m × ${W.toFixed(1)}m × ${H.toFixed(1)}m`;
    this.createLabel(dimText, 0, -0.05, 0);

    // Ceiling outline ring
    const ceilGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(L - 0.15, 0.01, W - 0.15));
    const ceilMat = new THREE.LineBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.1 });
    const ceil = new THREE.LineSegments(ceilGeo, ceilMat);
    ceil.position.set(0, H, 0);
    this.wallGroup.add(ceil);

    // Corner pillars (decorative)
    const corners = [
      [-L / 2, 0, -W / 2], [L / 2, 0, -W / 2],
      [L / 2, 0, W / 2], [-L / 2, 0, W / 2],
    ];
    corners.forEach((c) => {
      const pillarGeo = new THREE.CylinderGeometry(0.06, 0.06, H, 6);
      const pillarMat = new THREE.MeshBasicMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.15,
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(c[0], H / 2, c[1]);
      this.wallGroup.add(pillar);
    });

    // Axis arrows (N/S indicators)
    this.createLabel('N', 0, H + 1.2, -W / 2 - 1.2);
    this.createLabel('S', 0, H + 1.2, W / 2 + 1.2);
    this.createLabel('E', L / 2 + 1.2, H + 1.2, 0);
    this.createLabel('W', -L / 2 - 1.2, H + 1.2, 0);

    // Adjust camera on first load
    if (!this.hasInitialized) {
      setTimeout(() => {
        const maxDim = Math.max(L, W, H);
        this.camera.position.set(maxDim * 1.4, maxDim * 1.1, maxDim * 1.4);
        this.controls.target.set(0, H / 2, 0);
        this.controls.update();
      }, 50);
      this.hasInitialized = true;
    }
  }

  private createLabel(text: string, x: number, y: number, z: number) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 320;
    canvas.height = 120;

    // Background
    ctx.fillStyle = 'rgba(5, 15, 35, 0.75)';
    this.roundRect(ctx, 4, 4, canvas.width - 8, canvas.height - 8, 8);
    ctx.fill();

    // Border glow
    ctx.strokeStyle = 'rgba(0, 180, 255, 0.3)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, 4, 4, canvas.width - 8, canvas.height - 8, 8);
    ctx.stroke();

    const lines = text.split('\n');
    const lineHeights = [10, 34, 54, 74];
    const fontSizes = [26, 18, 16, 14];

    lines.forEach((line, i) => {
      const fontSize = fontSizes[i] || 14;
      ctx.font = `${i === 0 ? 'bold ' : ''}${fontSize}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      if (i === 0) {
        ctx.fillStyle = '#00b4ff';
      } else if (i === 1) {
        ctx.fillStyle = '#e8f0fe';
      } else {
        ctx.fillStyle = '#94a3b8';
      }

      ctx.fillText(line, canvas.width / 2, lineHeights[i] || 80);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      sizeAttenuation: true,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(x, y, z);
    sprite.scale.set(3, 1.125, 1);
    this.labelGroup.add(sprite);
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private clearGroup(group: THREE.Group) {
    while (group.children.length > 0) {
      const child = group.children[0];
      this.disposeObject(child);
      group.remove(child);
    }
  }

  private disposeObject(obj: THREE.Object3D) {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite) {
      obj.geometry?.dispose();
      if (obj instanceof THREE.Sprite && obj.material instanceof THREE.SpriteMaterial) {
        if (obj.material.map) obj.material.map.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    }
    if (obj instanceof THREE.LineSegments) {
      obj.geometry?.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    }
  }

  private animate = () => {
    this.animId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  destroy() {
    cancelAnimationFrame(this.animId);
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
