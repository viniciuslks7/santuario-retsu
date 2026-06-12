import { Canvas } from '@react-three/fiber'
import { Experience } from './components/scene/Experience'

function App() {
  return (
    <div className="h-full w-full">
      <Canvas
        shadows
        camera={{ position: [0, 11, 28], fov: 45, near: 0.1, far: 600 }}
        dpr={[1, 2]}
      >
        <Experience />
      </Canvas>
    </div>
  )
}

export default App
