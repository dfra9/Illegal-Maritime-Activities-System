// src/ThreeScene.js
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const ThreeScene = () => {
  const gltfUrl = process.env.PUBLIC_URL + '/scene.gltf'; // Path to your gltf file

  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Suspense fallback={null}>
        <Model url={gltfUrl} />
      </Suspense>
    </Canvas>
  );
};

const Model = ({ url }) => {
  const gltfLoader = new GLTFLoader();
  const [model, setModel] = React.useState(null);

  React.useEffect(() => {
    gltfLoader.load(url, setModel);
  }, [url, gltfLoader]);

  return model ? <primitive object={model.scene} /> : null;
};

export default ThreeScene;
