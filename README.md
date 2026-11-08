# 🚀 Vi3W Space Dodger

An endless, high-speed 3D arcade dodger built with **Three.js** and **Vite**, featuring custom 3D assets generated using **[Vi3W](https://app.vi3w.in)**.

<p align="left">
  <a href="https://vi3w-space-dodger.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/🚀%20PLAY%20LIVE%20DEMO-00F0FF?style=for-the-badge&logo=vercel&logoColor=000000&labelColor=080812" height="40" alt="Play Live Demo" />
  </a>
  &nbsp;
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" height="28" alt="Three.js" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" height="28" alt="Vite" />
</p>


---

## 🎮 Gameplay Overview

Take control of an advanced interstellar scout ship cruising through deep space. Navigate hostile asteroid belts, avoid collisions, and gather rare energy cores to rack up the highest score possible.

* **Dodge Hazards:** Steer clear of incoming volcanic space asteroids. A single collision destroys the ship.
* **Collect Crystals:** Grab floating energy cores for a +300 point boost.
* **Escalating Challenge:** Flight velocity accelerates over time, testing reaction speed and reflexes.
* **Local Persistence:** High scores are automatically saved to `localStorage`.

### Controls
| Key | Action |
| :--- | :--- |
| **`A`** / **`Left Arrow (←)`** | Steer Left (with dynamic roll banking) |
| **`D`** / **`Right Arrow (→)`** | Steer Right (with dynamic roll banking) |
| **`Space`** | Relaunch / Restart after collision |

---

## 🛠️ Vi3W Asset Workflow

All primary 3D game models were conceptualized, generated, and exported using **[Vi3W](https://app.vi3w.in)**:

1. **Player Ship (`player.glb`)**
   * *Concept:* Sleek sci-fi fighter with sharp forward wings and glowing engine accents.
   * *Method:* Canvas sketch $\to$ Nano Banana generation $\to$ 3D mesh conversion.
2. **Hazard Asteroids (`obstacle.glb`)**
   * *Concept:* Jagged volcanic space debris with surface fissures.
   * *Method:* Rough polygonal sketch $\to$ text prompt conditioning $\to$ 3D export.
3. **Power Core (`crystal.glb`)**
   * *Concept:* Floating faceted energy crystal with emissive golden highlights.
   * *Method:* Geometric outline sketch $\to$ 3D conversion $\to$ binary `.glb` download.

---

## ⚙️ Technical Highlights

### 1. Automated Model Normalization (`fitModelToSize`)
Generative 3D models often export with non-standard scales, offset pivots, or asymmetrical bounding boxes. Rather than manually editing each asset in Blender, the game implements an automated normalization helper:
* Computes the model's exact axis-aligned bounding box (`THREE.Box3`).
* Calculates the geometric center and shifts the child mesh to place its local pivot at true `(0, 0, 0)`.
* Scales the model proportionally so its maximum dimension strictly matches the engine's target size, ensuring consistent collision hitboxes.

```javascript
function fitModelToSize(object, targetDimension) {
  const container = new THREE.Group();
  container.add(object);

  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  const scale = targetDimension / (maxDim || 1);
  object.scale.setScalar(scale);

  object.position.x = -center.x * scale;
  object.position.y = -center.y * scale;
  object.position.z = -center.z * scale;

  return container;
}
```

### 2. Fallback Geometry Architecture
To avoid blank screens or runtime exceptions during asynchronous asset loading, each entity features a low-poly procedural fallback (wireframe cones, dodecahedrons, and octahedrons) that is swapped out seamlessly once the `.glb` finishes downloading.

### 3. Responsive Rendering & Shading
* **Lighting:** Multi-light configuration combining high-intensity ambient fill, directional rim lighting, and a local point light to highlight PBR roughness and metallic textures.
* **Atmosphere:** Distance fog (`THREE.FogExp2`) and a dynamic 1,200-particle starfield for visual depth.

---

## 🚀 Getting Started Locally

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
* `npm` package manager

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aaditya-Jain-01/vi3w-space-dodger.git
   cd vi3w-space-dodger
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 💡 Product Feedback for Vi3W

Using Vi3W to bootstrap game assets proved to be extremely fast—turning a rough 2D sketch into a textured, ready-to-render `.glb` file within minutes.

### Suggested Features for Game Developers:
* **Auto-Centered Pivot Option:** An export toggle to automatically center the model's origin to its bounding box center or base.
* **Automated LOD / Poly-Reduction:** Built-in decimation sliders to export lightweight, low-poly variants optimized for real-time mobile and web rendering.
* **Collider Metadata:** Including precomputed bounding sphere or box dimensions directly in custom GLTF extras.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
