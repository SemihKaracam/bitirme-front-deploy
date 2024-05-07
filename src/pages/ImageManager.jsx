import React, { useState } from "react";
import { fabric } from "fabric";

const ImageCanvas = ({ imageUrl }) => {
  const [canvasInstance, setCanvasInstance] = useState(null);

  // Canvas oluştur ve resmi ekle
  React.useEffect(() => {
    const newCanvasInstance = new fabric.Canvas();
    fabric.Image.fromURL(imageUrl, img => {
      newCanvasInstance.setBackgroundImage(img, newCanvasInstance.renderAll.bind(newCanvasInstance));
    });
    setCanvasInstance(newCanvasInstance);
  }, [imageUrl]);

  return (
    <div>
      <canvas ref={canvasInstance} />
    </div>
  );
};

const ImageManager = () => {
  const [images, setImages] = useState([]);

  const handleImageUpload = event => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      setImages(prevImages => [...prevImages, e.target.result]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input type="file" onChange={handleImageUpload} />
      {images.map((imageUrl, index) => (
        <ImageCanvas key={index} imageUrl={imageUrl} />
      ))}
    </div>
  );
};

export default ImageManager;